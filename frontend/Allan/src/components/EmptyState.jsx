import { IconEmpty } from './Icons';

export default function EmptyState({ type = 'default', title, description }) {
  return (
    <div className="empty-state card">
      <div className="empty-state__icon">
        <IconEmpty type={type} />
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}
