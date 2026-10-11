import DashboardCard from './DashboardCard';

function formatUpdatedAt(updatedAt) {
  if (!updatedAt) {
    return null;
  }

  return new Date(updatedAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatGameDate(date) {
  if (!date) {
    return null;
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

function SportsCard({ data, status = 'ready', error }) {
  const teams = data?.teams || [];
  const updatedTime = formatUpdatedAt(data?.updatedAt);

  return (
    <DashboardCard
      title="Sports"
      subtitle="Favorite teams"
      status={status}
      isEmpty={status === 'ready' && teams.length === 0}
      error={error || 'Sports results could not be loaded.'}
      footer={
        data?.usedStaleCache
          ? 'Live sports data unavailable — showing last saved data.'
          : updatedTime
            ? `Updated ${updatedTime}`
            : null
      }
      className="dashboard-card--extra-wide"
    >
      <div class="sports-list">
        {teams.map((team) => (
          <section class="sports-team" key={team.id}>
            <h3>{team.team}</h3>

            {team.source === 'not-configured' && (
              <p class="sports-message">
                Add this team’s external provider ID to enable scores.
              </p>
            )}

            {team.source === 'unavailable' && (
              <p class="sports-message">
                Sports data is temporarily unavailable.
              </p>
            )}

            {team.source !== 'not-configured'
              && team.source !== 'unavailable'
              && (
                <div class="sports-games">
                  <div class="sports-detail">
                    <span>Last</span>

                    {team.lastGame ? (
                      <p>
                        <strong
                          class={`result result--${team.lastGame.result.toLowerCase()}`}
                        >
                          {team.lastGame.result}
                        </strong>
                        {' '}
                        vs {team.lastGame.opponent} · {team.lastGame.score}
                      </p>
                    ) : (
                      <p>No recent completed game.</p>
                    )}
                  </div>

                  <div class="sports-detail">
                    <span>Next</span>

                    {team.nextGame ? (
                      <p>
                        {team.nextGame.homeAway === 'Home' ? 'vs' : 'at'}
                        {' '}
                        {team.nextGame.opponent}
                        {' · '}
                        {formatGameDate(team.nextGame.date)}
                        {team.nextGame.time ? `, ${team.nextGame.time}` : ''}
                      </p>
                    ) : (
                      <p>No upcoming game scheduled.</p>
                    )}
                  </div>
                </div>
              )}
          </section>
        ))}
      </div>
    </DashboardCard>
  );
}

export default SportsCard;