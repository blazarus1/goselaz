function DashboardCard({
  title,
  subtitle,
  status = 'ready',
  error,
  isEmpty = false,
  className = '',
  children,
  footer
}) {
  const cardClassName = `dashboard-card ${className}`.trim();

  if (status === 'loading') {
    return (
      <article class={cardClassName} aria-busy="true">
        <header class="card-header">
          <div>
            <p class="card-kicker">{subtitle}</p>
            <h2>{title}</h2>
          </div>
          <span class="card-status">Loading</span>
        </header>

        <div class="card-state card-state--loading">
          <div class="skeleton skeleton--title" />
          <div class="skeleton skeleton--line" />
          <div class="skeleton skeleton--line skeleton--line-short" />
        </div>
      </article>
    );
  }

  if (status === 'error') {
    return (
      <article class={cardClassName}>
        <header class="card-header">
          <div>
            <p class="card-kicker">{subtitle}</p>
            <h2>{title}</h2>
          </div>
          <span class="card-status card-status--error">Unavailable</span>
        </header>

        <div class="card-state card-state--error">
          <p class="state-icon" aria-hidden="true">!</p>
          <p>{error || `Unable to load ${title.toLowerCase()}.`}</p>
          <span>Try again after the next refresh.</span>
        </div>
      </article>
    );
  }

  if (isEmpty) {
    return (
      <article class={cardClassName}>
        <header class="card-header">
          <div>
            <p class="card-kicker">{subtitle}</p>
            <h2>{title}</h2>
          </div>
          <span class="card-status">All clear</span>
        </header>

        <div class="card-state card-state--empty">
          <p class="state-icon" aria-hidden="true">—</p>
          <p>Nothing to show right now.</p>
          <span>Check back later.</span>
        </div>
      </article>
    );
  }

  return (
    <article class={cardClassName}>
      <header class="card-header">
        <div>
          <p class="card-kicker">{subtitle}</p>
          <h2>{title}</h2>
        </div>
      </header>

      <div class="card-content">{children}</div>

      {footer && <footer class="card-footer">{footer}</footer>}
    </article>
  );
}

export default DashboardCard;