// Admin dashboard logic

document.addEventListener('DOMContentLoaded', async () => {
  // Check auth
  const session = await getAdminSession()
  if (!session) {
    location.href = 'admin-login.html'
    return
  }
  
  document.getElementById('admin-email')?.textContent && (document.getElementById('admin-email').textContent = session.user.email)
  
  // Load stats
  await renderStats()
  await renderWorksTable()
  await renderCommentsTable()
  await renderPageViews()
  
  // Tab switching
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'))
      document.querySelectorAll('.admin-panel').forEach(p => p.style.display = 'none')
      tab.classList.add('active')
      document.getElementById(tab.dataset.panel).style.display = 'block'
    })
  })
  
  // Work form submit
  document.getElementById('work-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const form = e.target
    const data = {
      title: form.title.value,
      description: form.description.value,
      image_url: form.image_url.value,
      category: form.category.value,
      tags: form.tags.value.split(',').map(t => t.trim()).filter(Boolean),
      order_index: parseInt(form.order_index.value) || 0,
      status: 'published'
    }
    const editId = form.dataset.editId
    if (editId) data.id = editId
    
    try {
      await saveWork(data)
      alert('保存成功！')
      form.reset()
      form.dataset.editId = ''
      document.getElementById('form-title').textContent = '添加作品'
      // Reset upload preview
      resetUploadPreview()
      await renderWorksTable()
    } catch (err) {
      alert('保存失败: ' + err.message)
    }
  })
  
  // File upload handling
  setupFileUpload()
  
  // Password form submit
  document.getElementById('password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const form = e.target
    const newPassword = form.new_password.value
    const confirmPassword = form.confirm_password.value
    const msgEl = document.getElementById('password-msg')
    
    if (newPassword !== confirmPassword) {
      msgEl.textContent = '两次输入的密码不一致'
      msgEl.style.color = '#ef4444'
      msgEl.style.display = 'block'
      return
    }
    
    if (newPassword.length < 6) {
      msgEl.textContent = '密码至少需要 6 个字符'
      msgEl.style.color = '#ef4444'
      msgEl.style.display = 'block'
      return
    }
    
    try {
      await updateAdminPassword(newPassword)
      msgEl.textContent = '密码修改成功！请重新登录。'
      msgEl.style.color = '#059669'
      msgEl.style.display = 'block'
      form.reset()
      // Auto logout after 2 seconds
      setTimeout(() => {
        adminLogout()
      }, 2000)
    } catch (err) {
      msgEl.textContent = '修改失败: ' + (err.message || '未知错误')
      msgEl.style.color = '#ef4444'
      msgEl.style.display = 'block'
    }
  })
  
  // Navigation form submit
  document.getElementById('nav-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const form = e.target
    const data = {
      label: form.label.value,
      url: form.url.value,
      order_index: parseInt(form.order_index.value) || 0,
      is_visible: form.is_visible.checked
    }
    const editId = form.dataset.editId
    if (editId) data.id = editId
    
    try {
      await saveNavItem(data)
      alert('保存成功！')
      form.reset()
      form.dataset.editId = ''
      document.getElementById('nav-form-title').textContent = '添加导航项'
      document.getElementById('nav-cancel-btn').style.display = 'none'
      await renderNavTable()
    } catch (err) {
      alert('保存失败: ' + err.message)
    }
  })
  
  // Load nav table when nav tab is clicked
  document.querySelector('.admin-tab[data-panel="navigation"]')?.addEventListener('click', () => {
    renderNavTable()
  })
})

async function renderStats() {
  const stats = await loadStats()
  const items = [
    ['总浏览量', stats.totalViews, '#1a3a5c'],
    ['今日浏览', stats.todayViews, '#2563eb'],
    ['30天浏览', stats.monthViews, '#059669'],
    ['总点赞', stats.totalLikes, '#dc2626'],
    ['总留言', stats.totalComments, '#7c3aed'],
    ['待审核留言', stats.pendingComments, '#d97706'],
    ['作品数量', stats.totalWorks, '#0891b2'],
  ]
  const container = document.getElementById('stats-grid')
  if (!container) return
  container.innerHTML = items.map(([label, value, color]) => `
    <div style="background:#fff;padding:1.5rem;border-radius:8px;border:1px solid #e5e7eb;text-align:center;">
      <div style="font-size:2rem;font-weight:700;color:${color};margin-bottom:0.3rem;">${value}</div>
      <div style="font-size:0.8rem;color:#6b7280;">${label}</div>
    </div>
  `).join('')
}

async function renderWorksTable() {
  const works = await loadWorks()
  const tbody = document.getElementById('works-table-body')
  if (!tbody) return
  tbody.innerHTML = works.map(w => `
    <tr>
      <td style="padding:0.8rem;border-bottom:1px solid #e5e7eb;font-size:0.85rem;">${w.title}</td>
      <td style="padding:0.8rem;border-bottom:1px solid #e5e7eb;font-size:0.85rem;color:#6b7280;">${w.category || '-'}</td>
      <td style="padding:0.8rem;border-bottom:1px solid #e5e7eb;font-size:0.85rem;color:#6b7280;">${w.likes_count || 0}</td>
      <td style="padding:0.8rem;border-bottom:1px solid #e5e7eb;font-size:0.85rem;">
        <button onclick="editWork('${w.id}')" style="background:#1a3a5c;color:#fff;border:none;padding:0.4rem 0.8rem;border-radius:4px;font-size:0.75rem;cursor:pointer;margin-right:0.3rem;">编辑</button>
        <button onclick="deleteWorkAndRefresh('${w.id}')" style="background:#ef4444;color:#fff;border:none;padding:0.4rem 0.8rem;border-radius:4px;font-size:0.75rem;cursor:pointer;">删除</button>
      </td>
    </tr>
  `).join('')
}

async function editWork(id) {
  const works = await loadWorks()
  const work = works.find(w => w.id === id)
  if (!work) return
  const form = document.getElementById('work-form')
  form.title.value = work.title || ''
  form.description.value = work.description || ''
  form.image_url.value = work.image_url || ''
  form.category.value = work.category || ''
  form.tags.value = (work.tags || []).join(', ')
  form.order_index.value = work.order_index || 0
  form.dataset.editId = work.id
  document.getElementById('form-title').textContent = '编辑作品'
  document.querySelector('.admin-tab[data-panel="works"]').click()
}

async function deleteWorkAndRefresh(id) {
  if (!confirm('确定删除此作品？')) return
  await deleteWork(id)
  await renderWorksTable()
  await renderStats()
}

async function renderCommentsTable() {
  const comments = await loadRecentComments()
  const tbody = document.getElementById('comments-table-body')
  if (!tbody) return
  tbody.innerHTML = comments.map(c => `
    <tr>
      <td style="padding:0.8rem;border-bottom:1px solid #e5e7eb;font-size:0.85rem;">${escapeHtml(c.name || 'Anonymous')}</td>
      <td style="padding:0.8rem;border-bottom:1px solid #e5e7eb;font-size:0.85rem;color:#6b7280;">${escapeHtml(c.works?.title || '主页')}</td>
      <td style="padding:0.8rem;border-bottom:1px solid #e5e7eb;font-size:0.85rem;color:#6b7280;">${escapeHtml(c.content.substring(0, 50))}${c.content.length > 50 ? '...' : ''}</td>
      <td style="padding:0.8rem;border-bottom:1px solid #e5e7eb;font-size:0.8rem;">
        <span style="display:inline-block;padding:0.2rem 0.6rem;border-radius:12px;font-size:0.7rem;font-weight:500;${c.status === 'approved' ? 'background:#d1fae5;color:#065f46;' : 'background:#fef3c7;color:#92400e;'}">${c.status === 'approved' ? '已通过' : '待审核'}</span>
      </td>
      <td style="padding:0.8rem;border-bottom:1px solid #e5e7eb;font-size:0.85rem;">
        ${c.status !== 'approved' ? `<button onclick="approveAndRefresh('${c.id}')" style="background:#059669;color:#fff;border:none;padding:0.4rem 0.8rem;border-radius:4px;font-size:0.75rem;cursor:pointer;margin-right:0.3rem;">通过</button>` : ''}
        <button onclick="deleteCommentAndRefresh('${c.id}')" style="background:#ef4444;color:#fff;border:none;padding:0.4rem 0.8rem;border-radius:4px;font-size:0.75rem;cursor:pointer;">删除</button>
      </td>
    </tr>
  `).join('')
}

async function approveAndRefresh(id) {
  await approveComment(id)
  await renderCommentsTable()
  await renderStats()
}

async function deleteCommentAndRefresh(id) {
  if (!confirm('确定删除此留言？')) return
  await deleteComment(id)
  await renderCommentsTable()
  await renderStats()
}

async function renderPageViews() {
  const views = await loadRecentPageViews()
  const tbody = document.getElementById('views-table-body')
  if (!tbody) return
  tbody.innerHTML = views.map(v => `
    <tr>
      <td style="padding:0.6rem 0.8rem;border-bottom:1px solid #e5e7eb;font-size:0.85rem;">${v.page_path}</td>
      <td style="padding:0.6rem 0.8rem;border-bottom:1px solid #e5e7eb;font-size:0.8rem;color:#6b7280;">${new Date(v.created_at).toLocaleString('zh-CN')}</td>
    </tr>
  `).join('')
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// File upload handling
function setupFileUpload() {
  const zone = document.getElementById('upload-zone')
  const input = document.getElementById('media-input')
  const preview = document.getElementById('upload-preview')
  const previewImg = document.getElementById('upload-preview-img')
  const previewVideo = document.getElementById('upload-preview-video')
  const progress = document.getElementById('upload-progress')
  const progressBar = document.getElementById('upload-progress-bar')
  const progressText = document.getElementById('upload-progress-text')
  const msgEl = document.getElementById('upload-msg')
  const urlInput = document.getElementById('image-url-input')
  
  if (!zone || !input) return
  
  // Click to select file
  zone.addEventListener('click', () => input.click())
  
  // File selected via input
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0]
    if (file) await handleFileUpload(file)
  })
  
  // Drag & drop
  zone.addEventListener('dragover', (e) => {
    e.preventDefault()
    zone.classList.add('dragover')
  })
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'))
  zone.addEventListener('drop', async (e) => {
    e.preventDefault()
    zone.classList.remove('dragover')
    const file = e.dataTransfer.files[0]
    if (file) await handleFileUpload(file)
  })
  
  async function handleFileUpload(file) {
    // Show preview
    preview.style.display = 'block'
    const url = URL.createObjectURL(file)
    if (file.type.startsWith('image/')) {
      previewImg.src = url
      previewImg.style.display = 'block'
      previewVideo.style.display = 'none'
    } else if (file.type.startsWith('video/')) {
      previewVideo.src = url
      previewVideo.style.display = 'block'
      previewImg.style.display = 'none'
    } else {
      preview.style.display = 'none'
    }
    
    // Show progress
    progress.style.display = 'block'
    progressBar.style.width = '30%'
    progressText.textContent = '正在上传...'
    msgEl.style.display = 'none'
    
    try {
      const result = await uploadMedia(file, `works/${Date.now()}-${file.name}`)
      progressBar.style.width = '100%'
      progressText.textContent = '上传完成！'
      
      // Fill URL input
      urlInput.value = result.publicUrl
      
      msgEl.textContent = '文件上传成功，URL 已自动填入'
      msgEl.style.color = '#059669'
      msgEl.style.display = 'block'
      
      // Hide progress after 2 seconds
      setTimeout(() => { progress.style.display = 'none' }, 2000)
    } catch (err) {
      progressBar.style.width = '0%'
      progressText.textContent = '上传失败'
      msgEl.textContent = '上传失败: ' + (err.message || '未知错误')
      msgEl.style.color = '#ef4444'
      msgEl.style.display = 'block'
    }
  }
}

function resetUploadPreview() {
  const preview = document.getElementById('upload-preview')
  const previewImg = document.getElementById('upload-preview-img')
  const previewVideo = document.getElementById('upload-preview-video')
  const progress = document.getElementById('upload-progress')
  const msgEl = document.getElementById('upload-msg')
  const input = document.getElementById('media-input')
  
  if (preview) preview.style.display = 'none'
  if (previewImg) { previewImg.src = ''; previewImg.style.display = 'none' }
  if (previewVideo) { previewVideo.src = ''; previewVideo.style.display = 'none' }
  if (progress) progress.style.display = 'none'
  if (msgEl) msgEl.style.display = 'none'
  if (input) input.value = ''
}

// Navigation management
async function renderNavTable() {
  const items = await loadNavigation()
  const tbody = document.getElementById('nav-table-body')
  if (!tbody) return
  tbody.innerHTML = items.map(item => `
    <tr>
      <td style="padding:0.8rem;border-bottom:1px solid #e5e7eb;font-size:0.85rem;">${escapeHtml(item.label)}</td>
      <td style="padding:0.8rem;border-bottom:1px solid #e5e7eb;font-size:0.85rem;color:#6b7280;">${escapeHtml(item.url)}</td>
      <td style="padding:0.8rem;border-bottom:1px solid #e5e7eb;font-size:0.85rem;color:#6b7280;">${item.order_index}</td>
      <td style="padding:0.8rem;border-bottom:1px solid #e5e7eb;font-size:0.8rem;">
        <span style="display:inline-block;padding:0.2rem 0.6rem;border-radius:12px;font-size:0.7rem;font-weight:500;${item.is_visible ? 'background:#d1fae5;color:#065f46;' : 'background:#fee2e2;color:#991b1b;'}">${item.is_visible ? '显示' : '隐藏'}</span>
      </td>
      <td style="padding:0.8rem;border-bottom:1px solid #e5e7eb;font-size:0.85rem;">
        <button onclick="editNavItem('${item.id}')" style="background:#1a3a5c;color:#fff;border:none;padding:0.4rem 0.8rem;border-radius:4px;font-size:0.75rem;cursor:pointer;margin-right:0.3rem;">编辑</button>
        <button onclick="deleteNavItemAndRefresh('${item.id}')" style="background:#ef4444;color:#fff;border:none;padding:0.4rem 0.8rem;border-radius:4px;font-size:0.75rem;cursor:pointer;">删除</button>
      </td>
    </tr>
  `).join('')
}

async function editNavItem(id) {
  const items = await loadNavigation()
  const item = items.find(i => i.id === id)
  if (!item) return
  const form = document.getElementById('nav-form')
  form.label.value = item.label || ''
  form.url.value = item.url || ''
  form.order_index.value = item.order_index || 0
  form.is_visible.checked = item.is_visible
  form.dataset.editId = item.id
  document.getElementById('nav-form-title').textContent = '编辑导航项'
  document.getElementById('nav-cancel-btn').style.display = 'inline-block'
}

function cancelNavEdit() {
  const form = document.getElementById('nav-form')
  form.reset()
  form.dataset.editId = ''
  document.getElementById('nav-form-title').textContent = '添加导航项'
  document.getElementById('nav-cancel-btn').style.display = 'none'
}

async function deleteNavItemAndRefresh(id) {
  if (!confirm('确定删除此导航项？')) return
  await deleteNavItem(id)
  await renderNavTable()
}

window.editWork = editWork
window.deleteWorkAndRefresh = deleteWorkAndRefresh
window.approveAndRefresh = approveAndRefresh
window.deleteCommentAndRefresh = deleteCommentAndRefresh
window.resetUploadPreview = resetUploadPreview
window.editNavItem = editNavItem
window.deleteNavItemAndRefresh = deleteNavItemAndRefresh
window.cancelNavEdit = cancelNavEdit
