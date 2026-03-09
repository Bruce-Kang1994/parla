import { useState } from 'react';

function formatDate(ts) {
  return new Date(ts).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(sec) {
  if (!sec) return '';
  if (sec < 60) return `${Math.round(sec)}秒`;
  return `${Math.floor(sec / 60)}分${Math.round(sec % 60)}秒`;
}

const CONTEXT_LABELS = {
  general: '通用',
  email: '邮件',
  chat: '聊天',
  document: '文档',
  code: '代码',
};

export default function History({ history, onRefresh, onClear }) {
  const [copiedId, setCopiedId] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const handleCopy = (item) => {
    window.murmur.copyText(item.polished);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleInsert = (item) => {
    window.murmur.insertText(item.polished);
  };

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>历史记录</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onRefresh}>刷新</button>
          {history.length > 0 && (
            <button className="btn btn-danger" onClick={onClear}>清空</button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">&#128203;</div>
            <div className="empty-state-text">暂无历史记录</div>
          </div>
        </div>
      ) : (
        <div className="card">
          {history.map(item => {
            const isExpanded = expandedIds.has(item.id);
            return (
              <div key={item.id} className="history-item">
                <div
                  className="history-text"
                  onClick={() => toggleExpand(item.id)}
                  style={{
                    cursor: 'pointer',
                    overflow: 'hidden',
                    maxHeight: isExpanded ? 400 : 40,
                    transition: 'max-height 0.2s ease',
                    lineHeight: '1.4em',
                  }}
                >
                  {item.polished}
                </div>
                {!isExpanded && item.polished && item.polished.length > 60 && (
                  <div
                    style={{ fontSize: 11, color: 'var(--primary)', cursor: 'pointer', marginTop: 2 }}
                    onClick={() => toggleExpand(item.id)}
                  >
                    展开全文
                  </div>
                )}
                {isExpanded && (
                  <div
                    style={{ fontSize: 11, color: 'var(--text-tertiary)', cursor: 'pointer', marginTop: 2 }}
                    onClick={() => toggleExpand(item.id)}
                  >
                    收起
                  </div>
                )}
                <div className="history-meta">
                  <span>{formatDate(item.timestamp)}</span>
                  {item.duration > 0 && <span>{formatDuration(item.duration)}</span>}
                  <span>{CONTEXT_LABELS[item.context] || item.context}</span>
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '2px 8px', fontSize: 11 }}
                      onClick={() => handleCopy(item)}
                    >
                      {copiedId === item.id ? '已复制' : '复制'}
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '2px 8px', fontSize: 11 }}
                      onClick={() => handleInsert(item)}
                    >
                      插入
                    </button>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
