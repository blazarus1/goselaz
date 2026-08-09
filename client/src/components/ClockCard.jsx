import { useEffect, useState } from 'preact/hooks';
import DashboardCard from './DashboardCard';

function ClockCard({ status = 'ready' }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

  return (
    <DashboardCard
      title="Right now"
      subtitle="Home dashboard"
      status={status}
      className="dashboard-card--clock"
    >
      <time class="clock-time" dateTime={now.toISOString()}>
        {now.toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit'
        })}
      </time>

      <p class="clock-date">
        {now.toLocaleDateString([], {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        })}
      </p>

      <p class="clock-year">{now.getFullYear()}</p>
    </DashboardCard>
  );
}

export default ClockCard;