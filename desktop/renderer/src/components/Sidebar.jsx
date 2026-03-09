const NAV_ITEMS = [
  {
    id: 'home',
    label: '首页',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'history',
    label: '历史记录',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: '设置',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function Sidebar({ page, onNavigate, usage, freeLimit, userPlan }) {
  const isPro = userPlan === 'pro';
  const usagePercent = isPro ? 0 : Math.min(100, Math.round((usage?.count || 0) / freeLimit * 100));

  const barColor = usagePercent >= 100
    ? 'var(--danger)'
    : usagePercent > 80
      ? 'var(--warning)'
      : undefined;

  return (
    <div className="sidebar">
      <div className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`sidebar-item ${page === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="sidebar-usage">
        {isPro ? (
          <>
            <div className="sidebar-usage-label" style={{ color: 'var(--primary)', fontWeight: 600 }}>Pro</div>
            <div className="sidebar-usage-text">
              已用 {(usage?.count || 0).toLocaleString()} 字 · 无限制
            </div>
          </>
        ) : (
          <>
            <div className="sidebar-usage-label">本周用量</div>
            <div className="sidebar-usage-bar">
              <div
                className="sidebar-usage-fill"
                style={{ width: `${usagePercent}%`, background: barColor }}
              />
            </div>
            <div className="sidebar-usage-text">
              {(usage?.count || 0).toLocaleString()} / {freeLimit.toLocaleString()} 字
            </div>
          </>
        )}
      </div>
    </div>
  );
}
