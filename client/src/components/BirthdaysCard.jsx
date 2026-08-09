import DashboardCard from './DashboardCard';

function BirthdaysCard({ data, status = 'ready' }) {
  const birthdays = data?.birthdays || [];

  return (
    <DashboardCard
      title="Birthdays"
      subtitle="Coming up"
      status={status}
      isEmpty={status === 'ready' && birthdays.length === 0}
      error="Birthday data could not be loaded."
      footer={data?.updatedAt ? `Last updated ${data.updatedAt}` : null}
    >
      <div class="birthday-list">
        {birthdays.map((birthday) => (
          <div class="birthday-row" key={birthday.id}>
            <div class="birthday-avatar" aria-hidden="true">
              {birthday.name.charAt(0)}
            </div>

            <div>
              <h3>{birthday.name}</h3>
              <p>{birthday.date}</p>
            </div>

            <span>{birthday.daysUntil}d</span>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

export default BirthdaysCard;