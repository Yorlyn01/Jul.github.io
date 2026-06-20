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
  
  // Load logs table when logs tab is clicked
  document.querySelector('.admin-tab[data-panel="logs"]')?.addEventListener('click', () => {
    renderLogsTable()
  })
  
  // Log file upload handler
  setupLogFileUpload()
  
  // Log form submit
  document.getElementById('log-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const form = e.target
    const data = {
      log_date: form.log_date.value,
      title: form.title.value,
      i18n_key: form.i18n_key.value,
      content: form.content.value,
      tags: form.tags.value,
      status: form.status.value
    }
    
    // Include translations if available
    const translationsInput = form.querySelector('#log-translations')
    if (translationsInput?.value) {
      try {
        data.translations = JSON.parse(translationsInput.value)
      } catch (e) {
        console.warn('Invalid translations JSON:', e)
      }
    }
    
    // Collect media URLs from textarea
    let mediaUrls = form.media_urls.value
      .split('\n')
      .map(u => u.trim())
      .filter(Boolean)
    
    data.media_urls = mediaUrls
    
    const editId = form.dataset.editId
    if (editId) data.id = editId
    
    try {
      await saveLog(data)
      alert('保存成功！')
      form.reset()
      form.dataset.editId = ''
      document.getElementById('log-form-title').textContent = '添加日志'
      document.getElementById('log-cancel-btn').style.display = 'none'
      resetLogUpload()
      // Clear translations
      const transInput = document.getElementById('log-translations')
      const transPreview = document.getElementById('translation-preview')
      if (transInput) transInput.value = ''
      if (transPreview) { transPreview.innerHTML = ''; transPreview.style.display = 'none' }
      await renderLogsTable()
    } catch (err) {
      alert('保存失败: ' + err.message)
    }
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

async function renderLogsTable() {
  const logs = await loadLogs()
  const tbody = document.getElementById('logs-table-body')
  if (!tbody) return
  tbody.innerHTML = logs.map(l => `
    <tr>
      <td style="padding:0.8rem;border-bottom:1px solid #e5e7eb;font-size:0.85rem;white-space:nowrap;">${l.log_date}</td>
      <td style="padding:0.8rem;border-bottom:1px solid #e5e7eb;font-size:0.85rem;font-weight:600;">${escapeHtml(l.title)}</td>
      <td style="padding:0.8rem;border-bottom:1px solid #e5e7eb;font-size:0.85rem;color:#6b7280;max-width:240px;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(l.content.substring(0, 60))}${l.content.length > 60 ? '...' : ''}</td>
      <td style="padding:0.8rem;border-bottom:1px solid #e5e7eb;font-size:0.8rem;">
        <span style="display:inline-block;padding:0.2rem 0.6rem;border-radius:12px;font-size:0.7rem;font-weight:500;${l.status === 'published' ? 'background:#d1fae5;color:#065f46;' : 'background:#e2e8f0;color:#475569;'}">${l.status === 'published' ? '已发布' : '草稿'}</span>
      </td>
      <td style="padding:0.8rem;border-bottom:1px solid #e5e7eb;font-size:0.85rem;">
        <button onclick="editLog('${l.id}')" style="background:#1a3a5c;color:#fff;border:none;padding:0.4rem 0.8rem;border-radius:4px;font-size:0.75rem;cursor:pointer;margin-right:0.3rem;">编辑</button>
        <button onclick="deleteLogAndRefresh('${l.id}')" style="background:#ef4444;color:#fff;border:none;padding:0.4rem 0.8rem;border-radius:4px;font-size:0.75rem;cursor:pointer;">删除</button>
      </td>
    </tr>
  `).join('')
}

async function editLog(id) {
  const logs = await loadLogs()
  const log = logs.find(l => l.id === id)
  if (!log) return
  const form = document.getElementById('log-form')
  form.log_date.value = log.log_date
  form.title.value = log.title || ''
  form.content.value = log.content || ''
  form.media_urls.value = (log.media_urls || []).join('\n')
  form.tags.value = (log.tags || []).join(', ')
  form.i18n_key.value = log.i18n_key || ''
  form.status.value = log.status || 'published'
  form.dataset.editId = log.id
  document.getElementById('log-form-title').textContent = '编辑日志'
  document.getElementById('log-cancel-btn').style.display = 'inline-block'
  resetLogUpload()
  // Load existing media as preview items
  if (Array.isArray(log.media_urls) && log.media_urls.length) {
    for (const url of log.media_urls) {
      if (url && url.trim()) addLogPreviewFromUrl(url.trim())
    }
  }
  // Load existing translations
  const translationsInput = document.getElementById('log-translations')
  const preview = document.getElementById('translation-preview')
  if (log.translations && translationsInput) {
    translationsInput.value = JSON.stringify(log.translations)
    if (preview) {
      const labels = { zh: '中文', en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch', ja: '日本語', ko: '한국어', ru: 'Русский' }
      preview.innerHTML = `
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:1rem;margin-top:1rem;">
          <div style="font-weight:600;color:#166534;margin-bottom:0.5rem;">✅ 已有翻译 (${Object.keys(log.translations).length} 种语言)</div>
          <div style="font-size:0.8rem;color:#4b5563;">
            ${Object.entries(log.translations).map(([lang, t]) => {
              return `<div style="margin-bottom:0.3rem;"><strong>${labels[lang] || lang}</strong>: ${escapeHtml(t.title)}</div>`
            }).join('')}
          </div>
        </div>
      `
      preview.style.display = 'block'
    }
  } else {
    if (translationsInput) translationsInput.value = ''
    if (preview) { preview.innerHTML = ''; preview.style.display = 'none' }
  }
}

function cancelLogEdit() {
  const form = document.getElementById('log-form')
  form.reset()
  form.dataset.editId = ''
  document.getElementById('log-form-title').textContent = '添加日志'
  document.getElementById('log-cancel-btn').style.display = 'none'
  resetLogUpload()
  // Clear translations
  const transInput = document.getElementById('log-translations')
  const transPreview = document.getElementById('translation-preview')
  if (transInput) transInput.value = ''
  if (transPreview) { transPreview.innerHTML = ''; transPreview.style.display = 'none' }
}

async function deleteLogAndRefresh(id) {
  if (!confirm('确定删除此日志？')) return
  await deleteLog(id)
  await renderLogsTable()
}

// ===== Log File Upload =====
function setupLogFileUpload() {
  const zone = document.getElementById('log-upload-zone')
  const input = document.getElementById('log-media-input')
  const previewGrid = document.getElementById('log-upload-preview-grid')
  const progress = document.getElementById('log-upload-progress')
  const progressBar = document.getElementById('log-upload-progress-bar')
  const progressText = document.getElementById('log-upload-progress-text')
  const msgEl = document.getElementById('log-upload-msg')
  const urlTextarea = document.getElementById('log-media-urls')
  
  if (!zone || !input) return
  
  // Store uploaded URLs
  if (!window.logUploadedUrls) window.logUploadedUrls = []
  
  zone.addEventListener('click', () => input.click())
  
  input.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files)
    if (files.length) {
      for (const file of files) {
        await handleLogFileUpload(file)
      }
    }
    input.value = '' // Reset so same files can be selected again
  })
  
  zone.addEventListener('dragover', (e) => {
    e.preventDefault()
    zone.classList.add('dragover')
  })
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'))
  zone.addEventListener('drop', async (e) => {
    e.preventDefault()
    zone.classList.remove('dragover')
    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      await handleLogFileUpload(file)
    }
  })
  
  async function handleLogFileUpload(file) {
    const safeName = (file.name || 'file')
      .replace(/[^\x00-\x7F]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9.\-_]/g, '')
    
    // Add preview item
    const itemId = 'log-upload-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)
    const previewItem = document.createElement('div')
    previewItem.className = 'upload-preview-item'
    previewItem.id = itemId
    previewItem.dataset.status = 'uploading'
    
    const url = URL.createObjectURL(file)
    if (file.type.startsWith('image/')) {
      previewItem.innerHTML = `<img src="${url}" alt="preview"><button class="remove-btn" onclick="removeLogPreview('${itemId}')">&times;</button>`
    } else if (file.type.startsWith('video/')) {
      previewItem.innerHTML = `<video src="${url}" muted></video><button class="remove-btn" onclick="removeLogPreview('${itemId}')">&times;</button>`
    } else {
      previewItem.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:#6b7280;">${file.name}</div><button class="remove-btn" onclick="removeLogPreview('${itemId}')">&times;</button>`
    }
    
    previewGrid.appendChild(previewItem)
    previewGrid.style.display = 'flex'
    
    progress.style.display = 'block'
    progressBar.style.width = '30%'
    progressText.textContent = `正在上传 ${safeName}...`
    msgEl.style.display = 'none'
    
    try {
      const result = await uploadMedia(file, `logs/${Date.now()}-${safeName}`)
      progressBar.style.width = '100%'
      progressText.textContent = '上传完成！'
      
      // Store URL on the preview item
      previewItem.dataset.url = result.publicUrl
      previewItem.dataset.status = 'uploaded'
      window.logUploadedUrls.push(result.publicUrl)
      
      // Update textarea
      if (urlTextarea) {
        const current = urlTextarea.value.trim()
        urlTextarea.value = current ? current + '\n' + result.publicUrl : result.publicUrl
      }
      
      msgEl.textContent = '文件上传成功'
      msgEl.style.color = '#059669'
      msgEl.style.display = 'block'
      
      setTimeout(() => { progress.style.display = 'none' }, 1500)
    } catch (err) {
      previewItem.dataset.status = 'error'
      previewItem.style.borderColor = '#ef4444'
      progressBar.style.width = '0%'
      progressText.textContent = '上传失败'
      msgEl.textContent = '上传失败: ' + (err.message || '未知错误')
      msgEl.style.color = '#ef4444'
      msgEl.style.display = 'block'
    }
  }
}


function addLogPreviewFromUrl(url) {
  if (!url) return
  const previewGrid = document.getElementById('log-upload-preview-grid')
  if (!previewGrid) return
  const itemId = 'log-existing-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)
  const previewItem = document.createElement('div')
  previewItem.className = 'upload-preview-item'
  previewItem.id = itemId
  previewItem.dataset.status = 'uploaded'
  previewItem.dataset.url = url
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(url) || url.includes('image')
  const isVideo = /\.(mp4|mov|avi|webm|mkv|flv|wmv)$/i.test(url) || url.includes('video')
  if (isImage) {
    previewItem.innerHTML = `<img src="${url}" alt="preview" onerror="this.parentElement.style.display='none'"><button class="remove-btn" onclick="removeLogPreview('${itemId}')">&times;</button>`
  } else if (isVideo) {
    previewItem.innerHTML = `<video src="${url}" muted></video><button class="remove-btn" onclick="removeLogPreview('${itemId}')">&times;</button>`
  } else {
    previewItem.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:#6b7280;">媒体</div><button class="remove-btn" onclick="removeLogPreview('${itemId}')">&times;</button>`
  }
  previewGrid.appendChild(previewItem)
  previewGrid.style.display = 'flex'
  if (!window.logUploadedUrls) window.logUploadedUrls = []
  window.logUploadedUrls.push(url)
}

function removeLogPreview(itemId) {
  const item = document.getElementById(itemId)
  if (!item) return
  const url = item.dataset.url
  if (url && window.logUploadedUrls) {
    window.logUploadedUrls = window.logUploadedUrls.filter(u => u !== url)
  }
  // Remove from textarea
  const urlTextarea = document.getElementById('log-media-urls')
  if (urlTextarea && url) {
    const lines = urlTextarea.value.split('\n').filter(l => l.trim() !== url)
    urlTextarea.value = lines.join('\n')
  }
  item.remove()
  const grid = document.getElementById('log-upload-preview-grid')
  if (grid && grid.children.length === 0) grid.style.display = 'none'
}

function resetLogUpload() {
  const grid = document.getElementById('log-upload-preview-grid')
  const progress = document.getElementById('log-upload-progress')
  const msgEl = document.getElementById('log-upload-msg')
  const input = document.getElementById('log-media-input')
  const urlTextarea = document.getElementById('log-media-urls')
  
  if (grid) { grid.innerHTML = ''; grid.style.display = 'none' }
  if (progress) progress.style.display = 'none'
  if (msgEl) msgEl.style.display = 'none'
  if (input) input.value = ''
  if (urlTextarea) urlTextarea.value = ''
  window.logUploadedUrls = []
}

async function translateText(text, targetLang) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = await response.json()
  if (!data || !data[0]) throw new Error('Invalid response')
  return data[0].map(part => part[0]).join('')
}

async function translateLog() {
  const form = document.getElementById('log-form')
  const title = form.title.value.trim()
  const content = form.content.value.trim()

  if (!title || !content) {
    alert('请先填写标题和内容')
    return
  }

  const btn = document.getElementById('translate-log-btn')
  const originalText = btn.textContent
  btn.textContent = '翻译中...'
  btn.disabled = true

  try {
    const languages = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'ru']
    const translations = { zh: { title, content } }

    for (const lang of languages) {
      const [translatedTitle, translatedContent] = await Promise.all([
        translateText(title, lang),
        translateText(content, lang)
      ])
      translations[lang] = {
        title: translatedTitle,
        content: translatedContent
      }
    }

    // Update hidden input
    const transInput = document.getElementById('log-translations')
    if (transInput) transInput.value = JSON.stringify(translations)

    // Show preview
    const preview = document.getElementById('translation-preview')
    if (preview) {
      const labels = { zh: '中文', en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch', ja: '日本語', ko: '한국어', ru: 'Русский' }
      preview.innerHTML = `
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:1rem;margin-top:1rem;">
          <div style="font-weight:600;color:#166534;margin-bottom:0.5rem;">✅ 翻译完成 (${Object.keys(translations).length} 种语言)</div>
          <div style="font-size:0.8rem;color:#4b5563;">
            ${Object.entries(translations).map(([lang, t]) => {
              return `<div style="margin-bottom:0.3rem;"><strong>${labels[lang] || lang}</strong>: ${escapeHtml(t.title)}</div>`
            }).join('')}
          </div>
        </div>
      `
      preview.style.display = 'block'
    }

  } catch (err) {
    console.error('Translation error:', err)
    alert('翻译失败: ' + err.message + '\n请检查网络连接，或手动保存后重试。')
  } finally {
    btn.textContent = originalText
    btn.disabled = false
  }
}

window.addLogPreviewFromUrl = addLogPreviewFromUrl
window.setupLogFileUpload = setupLogFileUpload
window.resetLogUpload = resetLogUpload
window.editLog = editLog
window.deleteLogAndRefresh = deleteLogAndRefresh
window.cancelLogEdit = cancelLogEdit
window.renderLogsTable = renderLogsTable
window.removeLogPreview = removeLogPreview
window.translateLog = translateLog
window.translateText = translateText
