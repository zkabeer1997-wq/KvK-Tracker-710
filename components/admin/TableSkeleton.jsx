export default function TableSkeleton({ columns = 6, rows = 6 }) {
  return (
    <div className="admin-skeleton" role="status" aria-label="Loading">
      <div className="admin-skeleton-head">
        {Array.from({ length: columns }).map((_, c) => (
          <span key={c} className="admin-skeleton-cell admin-skeleton-head-cell" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="admin-skeleton-row">
          {Array.from({ length: columns }).map((_, c) => (
            <span key={c} className="admin-skeleton-cell" />
          ))}
        </div>
      ))}
    </div>
  );
}
