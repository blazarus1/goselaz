import DashboardCard from './DashboardCard';

function getTimeParts(dateString) {
  const parts = new Intl.DateTimeFormat([], {
    hour: 'numeric',
    minute: '2-digit'
  }).formatToParts(new Date(dateString));

  const dayPeriod = parts.find((part) => part.type === 'dayPeriod')?.value || '';
  const time = parts
    .filter((part) => part.type !== 'dayPeriod')
    .map((part) => part.value)
    .join('')
    .trim();

  return { time, dayPeriod };
}

function formatTime(event) {
  if (event.isAllDay) {
    return 'All day';
  }

  const start = getTimeParts(event.start);
  const end = getTimeParts(event.end);

  const startLabel = start.dayPeriod === end.dayPeriod
    ? start.time
    : `${start.time} ${start.dayPeriod}`.trim();

  const endLabel = end.dayPeriod
    ? `${end.time} ${end.dayPeriod}`
    : end.time;

  return `${startLabel} – ${endLabel}`;
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

function CalendarDot({ calendarIndex }) {
  return <span class={`calendar-dot calendar-dot--${calendarIndex % 4}`} />;
}

function DayEvents({ events }) {
  return (
    <div class="event-list">
      {events.map((event) => (
        <div class="event-row" key={event.id}>
          <time dateTime={event.start}>{formatTime(event)}</time>

          <div>
            <h3>
              <CalendarDot calendarIndex={event.calendarIndex} />
              {event.title}
            </h3>
            {event.location && <p>{event.location}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function CalendarCard({ data, status = 'ready', error }) {
  const events = data?.events || [];

  return (
    <DashboardCard
      title="Today"
      subtitle="Google Calendar"
      status={status}
      isEmpty={status === 'ready' && events.length === 0}
      error={error || 'Calendar events could not be loaded.'}
      footer={
        data?.updatedAt
          ? `Updated ${formatUpdatedAt(data.updatedAt)}`
          : null
      }
    >
      <DayEvents events={events} />
    </DashboardCard>
  );
}

export default CalendarCard;