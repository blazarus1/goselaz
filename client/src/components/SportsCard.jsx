import DashboardCard from './DashboardCard';

function SportsCard({ data, status = 'ready' }) {
  const teams = data?.teams || [];

  return (
    <DashboardCard
      title="Sports"
      subtitle="Favorite teams"
      status={status}
      isEmpty={status === 'ready' && teams.length === 0}
      error="Sports results could not be loaded."
      footer={data?.updatedAt ? `Updated ${data.updatedAt}` : null}
    >
      <div class="sports-list">
        {teams.map((team) => (
          <section class="sports-team" key={team.id}>
            <h3>{team.team}</h3>
            <p class="sports-league">{team.league}</p>

            <div class="sports-detail">
              <span>Last</span>
              <p>
                <strong class={`result result--${team.lastGame.result.toLowerCase()}`}>
                  {team.lastGame.result}
                </strong>
                {' '}vs {team.lastGame.opponent} · {team.lastGame.score}
              </p>
            </div>

            <div class="sports-detail">
              <span>Next</span>
              <p>vs {team.nextGame.opponent} · {team.nextGame.date}</p>
            </div>
          </section>
        ))}
      </div>
    </DashboardCard>
  );
}

export default SportsCard;