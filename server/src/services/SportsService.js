const { getDb } = require('../db/db');

function getSportsCacheMinutes() {
  const configuredMinutes = Number(process.env.SPORTS_CACHE_MINUTES || 15);

  return Number.isFinite(configuredMinutes) && configuredMinutes > 0
    ? configuredMinutes
    : 15;
}

function getApiKey() {
  return process.env.THESPORTSDB_API_KEY || '123';
}

function getApiBaseUrl() {
  return `https://www.thesportsdb.com/api/v1/json/${getApiKey()}`;
}

function buildCacheKey(teamId) {
  return `sports:team:${teamId}`;
}

function getCachedResponse(cacheKey) {
  const db = getDb();

  return db.prepare(`
    SELECT
      payload_json AS payloadJson,
      fetched_at AS fetchedAt,
      expires_at AS expiresAt
    FROM cached_responses
    WHERE cache_key = ?
  `).get(cacheKey);
}

function saveCachedResponse(cacheKey, payload, expiresAt) {
  const db = getDb();

  db.prepare(`
    INSERT INTO cached_responses (
      cache_key,
      payload_json,
      source_name,
      fetched_at,
      expires_at
    )
    VALUES (?, ?, 'thesportsdb', ?, ?)

    ON CONFLICT(cache_key) DO UPDATE SET
      payload_json = excluded.payload_json,
      source_name = excluded.source_name,
      fetched_at = excluded.fetched_at,
      expires_at = excluded.expires_at
  `).run(
    cacheKey,
    JSON.stringify(payload),
    new Date().toISOString(),
    expiresAt
  );
}

function isCacheFresh(cachedResponse) {
  if (!cachedResponse?.expiresAt) {
    return false;
  }

  return new Date(cachedResponse.expiresAt) > new Date();
}

async function fetchApi(endpoint) {
  const url = `${getApiBaseUrl()}/${endpoint}`;
  const response = await fetch(url);

  if (!response.ok) {
    const responseText = await response.text();

    throw new Error(
      `TheSportsDB request failed: ${response.status} ${responseText}`
    );
  }

  return response.json();
}

function isHomeTeam(event, team) {
  return String(event.idHomeTeam) === String(team.externalTeamId)
    || event.strHomeTeam?.toLowerCase() === team.teamName.toLowerCase();
}

function normalizeCompletedGame(event, team) {
  const teamIsHome = isHomeTeam(event, team);

  const teamScore = Number(
    teamIsHome ? event.intHomeScore : event.intAwayScore
  );

  const opponentScore = Number(
    teamIsHome ? event.intAwayScore : event.intHomeScore
  );

  let result = 'T';

  if (teamScore > opponentScore) {
    result = 'W';
  } else if (teamScore < opponentScore) {
    result = 'L';
  }

  return {
    eventId: event.idEvent,
    date: event.dateEvent,
    time: event.strTime || null,
    opponent: teamIsHome ? event.strAwayTeam : event.strHomeTeam,
    homeAway: teamIsHome ? 'Home' : 'Away',
    teamScore,
    opponentScore,
    score: `${teamScore}–${opponentScore}`,
    result,
    venue: event.strVenue || null
  };
}

function normalizeUpcomingGame(event, team) {
  const teamIsHome = isHomeTeam(event, team);

  return {
    eventId: event.idEvent,
    date: event.dateEvent,
    time: event.strTime || 'Time TBD',
    opponent: teamIsHome ? event.strAwayTeam : event.strHomeTeam,
    homeAway: teamIsHome ? 'Home' : 'Away',
    venue: event.strVenue || null
  };
}

function findMostRecentCompletedGame(events, team) {
  if (!Array.isArray(events)) {
    return null;
  }

  const completedGames = events
    .filter(
      (event) =>
        event.intHomeScore !== null
        && event.intHomeScore !== undefined
        && event.intAwayScore !== null
        && event.intAwayScore !== undefined
    )
    .sort((a, b) => {
      return new Date(b.dateEvent) - new Date(a.dateEvent);
    });

  if (completedGames.length === 0) {
    return null;
  }

  return normalizeCompletedGame(completedGames[0], team);
}

function findNextUpcomingGame(events, team) {
  if (!Array.isArray(events)) {
    return null;
  }

  const today = new Date().toISOString().slice(0, 10);

  const upcomingGames = events
    .filter((event) => event.dateEvent >= today)
    .sort((a, b) => {
      return new Date(a.dateEvent) - new Date(b.dateEvent);
    });

  if (upcomingGames.length === 0) {
    return null;
  }

  return normalizeUpcomingGame(upcomingGames[0], team);
}

async function fetchSportsForTeam(team) {
  if (!team.externalTeamId) {
    return {
      id: team.id,
      team: team.teamName,
      sport: team.sport,
      league: team.league,
      source: 'not-configured',
      message: 'External team ID has not been configured.',
      lastGame: null,
      nextGame: null
    };
  }

  const cacheKey = buildCacheKey(team.externalTeamId);
  const cachedResponse = getCachedResponse(cacheKey);

  if (cachedResponse && isCacheFresh(cachedResponse)) {
    return {
      ...JSON.parse(cachedResponse.payloadJson),
      source: 'cache',
      fetchedAt: cachedResponse.fetchedAt,
      expiresAt: cachedResponse.expiresAt
    };
  }

  try {
    const [lastResponse, nextResponse] = await Promise.all([
      fetchApi(`eventslast.php?id=${team.externalTeamId}`),
      fetchApi(`eventsnext.php?id=${team.externalTeamId}`)
    ]);

    const sportsData = {
      id: team.id,
      team: team.teamName,
      sport: team.sport,
      league: team.league,
      lastGame: findMostRecentCompletedGame(lastResponse.results, team),
      nextGame: findNextUpcomingGame(nextResponse.events, team)
    };

    const fetchedAt = new Date().toISOString();

    const expiresAt = new Date(
      Date.now() + getSportsCacheMinutes() * 60 * 1000
    ).toISOString();

    saveCachedResponse(cacheKey, sportsData, expiresAt);

    return {
      ...sportsData,
      source: 'live',
      fetchedAt,
      expiresAt
    };
  } catch (error) {
    console.error(
      `Sports request failed for ${team.teamName}:`,
      error.message
    );

    if (cachedResponse) {
      return {
        ...JSON.parse(cachedResponse.payloadJson),
        source: 'stale-cache',
        fetchedAt: cachedResponse.fetchedAt,
        expiresAt: cachedResponse.expiresAt,
        fallbackMessage: 'Live sports data is unavailable. Showing last saved data.'
      };
    }

    return {
      id: team.id,
      team: team.teamName,
      sport: team.sport,
      league: team.league,
      source: 'unavailable',
      message: 'Sports data is temporarily unavailable.',
      lastGame: null,
      nextGame: null
    };
  }
}

async function getSportsDashboard() {
  const db = getDb();

  const teams = db.prepare(`
    SELECT
      id,
      team_name AS teamName,
      sport,
      league,
      data_source AS dataSource,
      external_team_id AS externalTeamId
    FROM favorite_teams
    WHERE is_active = 1
    ORDER BY sort_order ASC, team_name ASC
  `).all();

  const sportsTeams = await Promise.all(
    teams.map((team) => fetchSportsForTeam(team))
  );

  const usableTeams = sportsTeams.filter(
    (team) =>
      team.source !== 'unavailable'
      && team.source !== 'not-configured'
  );

  const updatedAt = usableTeams
    .map((team) => team.fetchedAt)
    .filter(Boolean)
    .sort()
    .at(-1) || null;

  return {
    updatedAt,
    cacheMinutes: getSportsCacheMinutes(),
    usedStaleCache: sportsTeams.some(
      (team) => team.source === 'stale-cache'
    ),
    teams: sportsTeams
  };
}

module.exports = {
  getSportsDashboard
};