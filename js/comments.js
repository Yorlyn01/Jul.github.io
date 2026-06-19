// Comments module

async function loadComments(workId) {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('comments')
    .select('*')
    .eq('work_id', workId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
  if (error) { console.error('Comments load error:', error); return [] }
  return data || []
}

async function submitComment(formData) {
  const sb = await getSupabase()
  const { data, error } = await sb.from('comments').insert({
    work_id: formData.work_id,
    name: formData.name,
    email: formData.email,
    content: formData.content,
    status: 'pending'
  }).select()
  if (error) throw error
  return data
}

function renderComments(container, comments) {
  if (!comments.length) {
    container.innerHTML = '<p style="color:#6b7280;font-size:0.85rem;padding:1rem 0;">暂无留言，来做第一个留言的人吧！</p>'
    return
  }
  container.innerHTML = comments.map(c => `
    <div class="comment-item" style="padding:1rem 0;border-bottom:1px solid #e5e7eb;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;">
        <strong style="font-size:0.9rem;color:#1a1a2e;">${escapeHtml(c.name || 'Anonymous')}</strong>
        <span style="font-size:0.7rem;color:#9ca3af;">${formatDate(c.created_at)}</span>
      </div>
      <p style="font-size:0.85rem;color:#4b5563;line-height:1.6;">${escapeHtml(c.content)}</p>
    </div>
  `).join('')
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

window.loadComments = loadComments
window.submitComment = submitComment
window.renderComments = renderComments
