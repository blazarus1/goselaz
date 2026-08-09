import DashboardCard from './DashboardCard';

function AnnouncementsCard({ data, status = 'ready' }) {
  const announcements = data?.announcements || [];

  return (
    <DashboardCard
      title="Household notes"
      subtitle="Announcements"
      status={status}
      isEmpty={status === 'ready' && announcements.length === 0}
      error="Announcements could not be loaded."
    >
      <div class="announcement-list">
        {announcements.map((announcement) => (
          <div class="announcement-row" key={announcement.id}>
            <span
              class={`priority-dot priority-dot--${announcement.priority}`}
              aria-label={`${announcement.priority} priority`}
            />

            <div>
              <h3>{announcement.title}</h3>
              <p>{announcement.body}</p>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

export default AnnouncementsCard;