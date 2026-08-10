import DashboardCard from './DashboardCard';

function formatTime(event) {
  if (event.isAllDay) {
    return 'All day';
  }

  return new Date(event.start).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function formatUpdatedAt(updatedAt) {
  if (!updatedAt) {
    return null;
  }

  return new Date(updatedAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function DayEvents({ events }) {
  return (
    <div class="event-list">
      {events.map((event) => (
        <div class="event-row" key={event.id}>
          <time dateTime={event.start}>{formatTime(event)}</time>

          <div>
            <h3>{event.title}</h3>
            {event.location && <p>{event.location}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function WeekEvents({ days }) {
  return (
    <div class="week-list">
      {days.map((day) => (
        <section class="week-day" key={day.date}>
          <h3>{day.label}</h3>

          {day.events.length === 0 ? (
            <p class="week-day__empty">No events</p>
          ) : (
            day.events.map((event) => (
              <div class="week-event" key={event.id}>
                <span>{formatTime(event)}</span>
                <p>{event.title}</p>
              </div>
            ))
          )}
        </section>
      ))}
    </div>
  );
}

function CalendarCard({ data, status = 'ready', error }) {
  const view = data?.view || 'day';
  const events = data?.events || [];
  const days = data?.days || [];

  const isEmpty = view === 'week'
    ? days.every((day) => day.events.length === 0)
    : events.length === 0;

  return (
    <DashboardCard
      title={view === 'week' ? 'This week' : 'Today'}
      subtitle="Google Calendar"
      status={status}
      isEmpty={status === 'ready' && isEmpty}
      error={error || 'Calendar events could not be loaded.'}
      footer={
        data?.updatedAt
          ? `Updated ${formatUpdatedAt(data.updatedAt)}`
          : null
      }
      className="dashboard-card--calendar"
    >
      {view === 'week'
        ? <WeekEvents days={days} />
        : <DayEvents events={events} />}
    </DashboardCard>
  );
}

export default CalendarCard;