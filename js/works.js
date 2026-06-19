// Works module - load and display portfolio items

async function loadWorks(options = {}) {
  const sb = await getSupabase()
  let query = sb.from('works').select('*').order('order_index', { ascending: true })
  if (options.status) query = query.eq('status', options.status)
  const { data, error } = await query
  if (error) { console.error('Works load error:', error); return [] }
  return data || []
}

async function renderWorks(containerSelector, options = {}) {
  const works = await loadWorks(options)
  const container = document.querySelector(containerSelector)
  if (!container) return
  if (!works.length) {
    container.innerHTML = '<p style="color:#6b7280;padding:2rem 0;">暂无作品，管理员请在后台添加。</p>'
    return
  }
  container.innerHTML = works.map(w => renderWorkCard(w)).join('')
  
  // Bind like buttons
  container.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault()
      e.stopPropagation()
      await likeWork(btn.dataset.id)
      btn.classList.toggle('liked')
      const count = btn.querySelector('.like-count')
      if (count) count.textContent = parseInt(count.textContent) + 1
    })
  })
}

function renderWorkCard(work) {
  const imgHtml = work.image_url 
    ? `<img src="${escapeHtml(work.image_url)}" alt="${escapeHtml(work.title)}" loading="lazy">`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1a3a5c,#2a5280);color:#fff;font-size:2rem;font-weight:700;">${work.title ? work.title.substring(0,2) : 'W'}</div>`
  
  return `
    <div class="portfolio-item" data-id="${work.id}">
      ${imgHtml}
      <div class="portfolio-overlay">
        <h3>${escapeHtml(work.title || 'Untitled')}</h3>
        <p>${escapeHtml(work.description || '')}</p>
        <div style="margin-top:0.8rem;display:flex;gap:0.6rem;align-items:center;">
          <button class="like-btn" data-id="${work.id}" style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);color:#fff;padding:0.4rem 0.8rem;border-radius:20px;font-size:0.75rem;cursor:pointer;transition:all 0.2s;">
            <span style="margin-right:0.3rem;">♥</span> <span class="like-count">${work.likes_count || 0}</span>
          </button>
          <a href="work-detail.html?id=${work.id}" style="background:rgba(255,255,255,0.9);color:#1a3a5c;padding:0.4rem 0.9rem;border-radius:20px;font-size:0.75rem;text-decoration:none;font-weight:600;">查看详情</a>
        </div>
      </div>
    </div>
  `
}

async function likeWork(workId) {
  try {
    const sb = await getSupabase()
    await sb.from('likes').insert({ work_id: workId })
    await sb.rpc('increment_likes', { work_id: workId })
  } catch (e) { console.error('Like failed:', e) }
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

window.loadWorks = loadWorks
window.renderWorks = renderWorks
window.likeWork = likeWork
