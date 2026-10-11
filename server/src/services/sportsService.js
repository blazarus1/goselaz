const { getDb } = require('../db/db');

const ESPN_API_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports';

// Maps a team's league (and sport, where the league is ambiguous) to the
// ESPN path segment used in its API URLs.
const ESPN_LEAGUE_PATHS = {
  NFL: 'football/nfl',
  NBA: 'basketball/nba',
  WNBA: 'basketball/wnba',
  MLB: 'baseball/mlb',
  NHL: 'hockey/nhl',
  MLS: 'soccer/usa.1',
  NWSL: 'soccer/usa.nwsl',
  'NCAA:FOOTBALL': 'football/college-football',
  'NCAA:BASKETBALL': 'basketball/mens-college-basketball',
  NCAAW: 'basketball/womens-college-basketball',
  'NCAAW:BASKETBALL': 'basketball/womens-college-basketball'
};

function getSportsCacheMinutes() {
  const configuredMinutes = Number(process.env.SPORTS_CACHE_MINUTES || 15);

  return Number.isFinite(configuredMinutes) && configuredMinutes > 0
    ? configuredMinutes
    : 15;
}

function getEspnLeaguePath(team) {
  const league = (team.league || '').trim().toUpperCase();
  const sport = (team.sport || '').trim().toUpperCase();

  return ESPN_LEAGUE_PATHS[`${league}:${sport}`]
    || ESPN_LEAGUE_PATHS[league]
    || null;
}

function buildCacheKey(leaguePath, teamId) {
  return `sports:espn:${leaguePath}:${teamId}`;
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
    VALUES (?, ?, 'espn', ?, ?)

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
  const url = `${ESPN_API_BASE_URL}/${endpoint}`;
  const response = await fetch(url);

  if (!response.ok) {
    const responseText = await response.text();

    throw new Error(
      `ESPN request failed: ${response.status} ${responseText}`
    );
  }

  return response.json();
}

// ESPN's default team schedule omits some postseason games (e.g. college
// bowl games), so the postseason schedule is requested too and merged in.
async function fetchTeamEvents(leaguePath, teamId) {
  const scheduleUrl = `${leaguePath}/teams/${encodeURIComponent(teamId)}/schedule`;

  const [defaultSchedule, postseasonSchedule] = await Promise.all([
    fetchApi(scheduleUrl),
    fetchApi(`${scheduleUrl}?seasontype=3`)
  ]);

  const eventsById = new Map();

  [
    ...(defaultSchedule.events || []),
    ...(postseasonSchedule.events || [])
  ].forEach((event) => {
    eventsById.set(event.id, event);
  });

  return [...eventsById.values()];
}

function formatLocalDate(dateValue) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.TZ || undefined,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dateValue);
}

function formatLocalTime(dateValue) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: process.env.TZ || undefined,
    hour: 'numeric',
    minute: '2-digit'
  }).format(dateValue);
}

function getScore(competitor) {
  const score = competitor?.score;

  if (score === null || score === undefined) {
    return null;
  }

  const value = Number(typeof score === 'object' ? score.value : score);

  return Number.isFinite(value) ? value : null;
}

function getTeamCompetitors(event, team) {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors || [];

  const teamCompetitor = competitors.find(
    (competitor) =>
      String(competitor.team?.id) === String(team.externalTeamId)
  );

  const opponentCompetitor = competitors.find(
    (competitor) => competitor !== teamCompetitor
  );

  return {
    competition,
    teamCompetitor,
    opponentCompetitor
  };
}

function normalizeCompletedGame(event, team) {
  const {
    competition,
    teamCompetitor,
    opponentCompetitor
  } = getTeamCompetitors(event, team);

  const teamScore = getScore(teamCompetitor);
  const opponentScore = getScore(opponentCompetitor);
  const eventDate = new Date(event.date);

  let result = 'T';

  if (teamCompetitor?.winner === true || teamScore > opponentScore) {
    result = 'W';
  } else if (
    opponentCompetitor?.winner === true
    || teamScore < opponentScore
  ) {
    result = 'L';
  }

  return {
    eventId: event.id,
    date: formatLocalDate(eventDate),
    time: competition?.timeValid === false
      ? null
      : formatLocalTime(eventDate),
    opponent: opponentCompetitor?.team?.displayName || 'TBD',
    homeAway: teamCompetitor?.homeAway === 'home' ? 'Home' : 'Away',
    teamScore,
    opponentScore,
    score: `${teamScore}–${opponentScore}`,
    result,
    venue: competition?.venue?.fullName || null
  };
}

function normalizeUpcomingGame(event, team) {
  const {
    competition,
    teamCompetitor,
    opponentCompetitor
  } = getTeamCompetitors(event, team);

  const eventDate = new Date(event.date);

  return {
    eventId: event.id,
    date: formatLocalDate(eventDate),
    time: competition?.timeValid === false
      ? 'Time TBD'
      : formatLocalTime(eventDate),
    opponent: opponentCompetitor?.team?.displayName || 'TBD',
    homeAway: teamCompetitor?.homeAway === 'home' ? 'Home' : 'Away',
    venue: competition?.venue?.fullName || null
  };
}

function getEventState(event) {
  return event.competitions?.[0]?.status?.type?.state;
}

function findMostRecentCompletedGame(events, team) {
  const completedGames = events
    .filter((event) => {
      const { teamCompetitor, opponentCompetitor } = getTeamCompetitors(
        event,
        team
      );

      return getEventState(event) === 'post'
        && getScore(teamCompetitor) !== null
        && getScore(opponentCompetitor) !== null;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (completedGames.length === 0) {
    return null;
  }

  return normalizeCompletedGame(completedGames[0], team);
}

function findNextUpcomingGame(events, team) {
  const upcomingGames = events
    .filter((event) => getEventState(event) === 'pre')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

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

  const leaguePath = getEspnLeaguePath(team);

  if (!leaguePath) {
    return {
      id: team.id,
      team: team.teamName,
      sport: team.sport,
      league: team.league,
      source: 'not-configured',
      message: `League "${team.league || ''}" is not supported for ${team.sport}.`,
      lastGame: null,
      nextGame: null
    };
  }

  const cacheKey = buildCacheKey(leaguePath, team.externalTeamId);
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
    const events = await fetchTeamEvents(leaguePath, team.externalTeamId);

    const sportsData = {
      id: team.id,
      team: team.teamName,
      sport: team.sport,
      league: team.league,
      lastGame: findMostRecentCompletedGame(events, team),
      nextGame: findNextUpcomingGame(events, team)
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