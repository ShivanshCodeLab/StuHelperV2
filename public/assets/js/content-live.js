// Notice centre: shows admin notices on every student page and refreshes them as soon as the
// background sync finishes (the old banner was built once from stale data, so new notices only
// appeared on the NEXT page load, and only the single latest one was visible).
(() => {
  const page = location.pathname.split('/').pop() || 'index.html';
  if (['login.html', 'admin.html', 'login'].includes(page)) return;
  const parse = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const READ = 'dh__noticeRead', HIDE = 'dh__noticeHidden';

  const style = document.createElement('style');
  style.textContent = `
  #shNotices{margin-bottom:14px;display:grid;gap:8px}
  #shNotices .nt-banner{padding:12px 15px;border-radius:14px;border:1px solid #bfdbfe;background:#eff6ff;color:#1e3a8a;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;font-size:12.5px}
  #shNotices .nt-banner.high{border-color:#fecaca;background:#fef2f2;color:#991b1b}
  #shNotices .nt-banner p{margin:3px 0 0;white-space:pre-wrap}
  #shNotices .nt-x{border:0;background:transparent;font-weight:800;cursor:pointer;color:inherit;font-size:14px}
  #shNotices .nt-bar{display:flex;justify-content:flex-end}
  #shNotices .nt-toggle{border:1px solid var(--line,#e5e7eb);background:var(--surface,#fff);color:inherit;border-radius:999px;padding:6px 13px;font:700 12px inherit;cursor:pointer}
  #shNotices .nt-count{background:#dc2626;color:#fff;border-radius:999px;padding:1px 7px;margin-left:6px;font-size:11px}
  #shNotices .nt-list{border:1px solid var(--line,#e5e7eb);border-radius:14px;background:var(--surface,#fff);padding:6px 14px;max-height:340px;overflow:auto}
  #shNotices .nt-item{padding:10px 0;border-bottom:1px solid var(--line,#e5e7eb);font-size:12.5px}
  #shNotices .nt-item:last-child{border-bottom:0}
  #shNotices .nt-item small{color:#81879d}
  #shNotices .nt-new{background:#dcfce7;color:#15803d;border-radius:999px;padding:1px 7px;font-size:10px;font-weight:800;margin-left:6px}`;
  document.head.appendChild(style);

  let open = false;
  function mount() {
    const main = document.querySelector('main.main-content');
    if (!main) return null;
    let box = document.getElementById('shNotices');
    if (!box) { box = document.createElement('div'); box.id = 'shNotices'; main.prepend(box); }
    return box;
  }

  function render() {
    const box = mount();
    if (!box) return;
    const session = parse('dh_session', null) || {};
    const sem = session.semester || '';
    const all = parse('dh_admin_notices', []).filter(n => n && n.active !== false &&
      (session.role === 'admin' || !n.audience || n.audience === 'All Semesters' || n.audience === sem));
    const read = new Set(parse(READ, [])), hidden = new Set(parse(HIDE, []));
    const unread = all.filter(n => !read.has(n.id));
    const banners = all.filter(n => !hidden.has(n.id)).sort((a, b) => (b.priority === 'High') - (a.priority === 'High')).slice(0, 3);

    box.innerHTML = banners.map(n => `<div class="nt-banner ${n.priority === 'High' ? 'high' : ''}" data-id="${esc(n.id)}"><div><strong>📢 ${esc(n.title)}</strong> <span style="opacity:.75">(${esc(n.audience || 'All')})</span><p>${esc(n.body)}</p></div><button class="nt-x" type="button" aria-label="Dismiss notice">✕</button></div>`).join('') +
      (all.length ? `<div class="nt-bar"><button class="nt-toggle" type="button">🔔 All notices${unread.length ? `<span class="nt-count">${unread.length}</span>` : ''}</button></div>` : '') +
      (open ? `<div class="nt-list">${all.map(n => `<div class="nt-item"><strong>${esc(n.title)}</strong>${!read.has(n.id) ? '<span class="nt-new">NEW</span>' : ''} ${n.priority === 'High' ? '<span class="nt-new" style="background:#fee2e2;color:#b91c1c">HIGH</span>' : ''}<div style="margin-top:3px;white-space:pre-wrap">${esc(n.body)}</div><small>${esc(n.audience || 'All Semesters')} · ${esc(n.createdAt || '')}</small></div>`).join('')}</div>` : '');

    box.querySelectorAll('.nt-x').forEach(b => b.onclick = () => {
      const id = b.closest('.nt-banner').dataset.id;
      localStorage.setItem(HIDE, JSON.stringify([...hidden, id])); render();
    });
    const t = box.querySelector('.nt-toggle');
    if (t) t.onclick = () => {
      open = !open;
      if (open) localStorage.setItem(READ, JSON.stringify([...new Set([...read, ...all.map(n => n.id)])]));
      render();
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
  window.addEventListener('sh-content-updated', render);
})();
