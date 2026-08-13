import DashboardCard from './DashboardCard';

function formatUpdatedAt(updatedAt) {
  if (!updatedAt) {
    return null;
  }

  return new Date(updatedAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function GroceryListCard({ data, status = 'ready', error, onToggleItem }) {
  const items = data?.items || [];
  const updatedTime = formatUpdatedAt(data?.updatedAt);

  return (
    <DashboardCard
      title="Grocery list"
      subtitle="Tap an item when it's in the cart"
      status={status}
      isEmpty={status === 'ready' && items.length === 0}
      error={error || 'Grocery list could not be loaded.'}
      footer={updatedTime ? `Updated ${updatedTime}` : null}
    >
      <ul class="grocery-list">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              class={
                item.isChecked
                  ? 'grocery-item grocery-item--checked'
                  : 'grocery-item'
              }
              aria-pressed={item.isChecked}
              onClick={() => onToggleItem(item.id)}
            >
              <span class="grocery-item__check" aria-hidden="true" />

              <span class="grocery-item__label">
                {item.item}
                {item.quantity && (
                  <span class="grocery-item__quantity"> · {item.quantity}</span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}

export default GroceryListCard;
