import DashboardCard from './DashboardCard';

function CountdownCard({ data, status = 'ready' }) {
  const countdowns = data?.countdowns || [];

  return (
    <DashboardCard
      title="Countdowns"
      subtitle="Worth looking forward to"
      status={status}
      isEmpty={status === 'ready' && countdowns.length === 0}
      error="Countdowns could not be loaded."
    >
      <div class="countdown-list">
        {countdowns.map((countdown) => (
          <div class="countdown-row" key={countdown.id}>
            <div>
              <h3>{countdown.title}</h3>
              <p>{countdown.date}</p>
            </div>

            <strong>
              {countdown.daysUntil}
              <span> days</span>
            </strong>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

export default CountdownCard;