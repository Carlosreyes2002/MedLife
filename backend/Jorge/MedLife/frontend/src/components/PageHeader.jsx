export default function PageHeader({ title, subtitle, action, badge }) {
  return (
    <header className="page-header">
      <div className="page-header__content">
        {badge && <span className="page-header__badge">{badge}</span>}
        <h1>{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {action && <div className="page-header__action">{action}</div>}
    </header>
  );
}
