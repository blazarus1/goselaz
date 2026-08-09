import DashboardCard from './DashboardCard';

function CalendarCard({ data, status = 'ready' }) {
  const events = data?.events || [];

  return (
    <DashboardCard
      title="Today"
      subtitle="Calendar"
      status={status}
      isEmpty={status === 'ready' && events.length === 0}
      error="Calendar events could not be loaded."
      footer={data?.updatedAt ? `Updated ${data.updatedAt}` : null}
      className="dashboard-card--calendar"
    >
      <div class="event-list">
        {events.map((event) => (
          <div class="event-row" key={event.id}>
            <time dateTime={event.start}>{event.time}</time>

            <div>
              <h3>{event.title}</h3>
              <p>{event.location}</p>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

export default CalendarCard;