function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function CalendarDot({ calendarIndex }) {
  return <span class={`calendar-dot calendar-dot--${calendarIndex % 4}`} />;
}

function WeekOutlookBar({ status = 'ready', data, error }) {
  const days = data?.days || [];
  const todayKey = getLocalDateKey(new Date());

  if (status === 'loading') {
    return (
      <section class="outlook-bar" aria-label="7 day outlook">
        <div class="skeleton skeleton--line" />
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section class="outlook-bar outlook-bar--error" aria-label="7 day outlook">
        <p>{error || 'This week’s outlook could not be loaded.'}</p>
      </section>
    );
  }

  return (
    <section class="outlook-bar" aria-label="7 day outlook">
      {days.map((day) => {
        const visibleEvents = day.events.slice(0, 3);
        const remaining = day.events.length - visibleEvents.length;

        return (
          <div
            class={
              day.date === todayKey
                ? 'outlook-day outlook-day--today'
                : 'outlook-day'
            }
            key={day.date}
          >
            <p class="outlook-day__label">{day.label}</p>

            {day.events.length === 0 ? (
              <p class="outlook-day__empty">No events</p>
            ) : (
              <ul class="outlook-day__events">
                {visibleEvents.map((event) => (
                  <li key={event.id}>
                    <CalendarDot calendarIndex={event.calendarIndex} />
                    <span>{event.title}</span>
                  </li>
                ))}

                {remaining > 0 && (
                  <li class="outlook-day__more">+{remaining} more</li>
                )}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}

export default WeekOutlookBar;
