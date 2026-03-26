/**
 * Reusable empty-state placeholder.
 *
 * Usage:
 *   <EmptyState
 *     icon={<InboxFill size={28} />}
 *     title="Nicio cerere"
 *     description="Adaugă o cerere nouă pentru a începe."
 *   />
 */
export default function EmptyState({ icon, title, description }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h6 className="fw-semibold mb-1">{title}</h6>
      {description && <p className="text-muted small mb-0">{description}</p>}
    </div>
  );
}
