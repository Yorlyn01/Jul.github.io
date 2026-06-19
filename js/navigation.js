// Navigation module - dynamic menu loading

async function loadNavigation() {
  const sb = await getSupabase()
  const { data, error } = await sb.from('navigation')
    .select('*')
    .eq('is_visible', true)
    .order('order_index', { ascending: true })
  if (error) { console.error('Nav load error:', error); return [] }
  return data || []
}

async function saveNavItem(item) {
  const sb = await getSupabase()
  if (item.id) {
    const { data, error } = await sb.from('navigation').update(item).eq('id', item.id).select()
    if (error) throw error
    return data
  } else {
    const { data, error } = await sb.from('navigation').insert(item).select()
    if (error) throw error
    return data
  }
}

async function deleteNavItem(id) {
  const sb = await getSupabase()
  const { error } = await sb.from('navigation').delete().eq('id', id)
  if (error) throw error
}

function renderNavigation() {
  loadNavigation().then(items => {
    const currentPage = location.pathname.split('/').pop() || 'index.html'
    
    // Desktop side nav
    const desktopNav = document.querySelector('.side-nav .nav-links')
    if (desktopNav) {
      desktopNav.innerHTML = items.map(item => {
        const isActive = currentPage === item.url || (currentPage === '' && item.url === 'index.html')
        return `<a href="${item.url}" class="${isActive ? 'active' : ''}">${escapeHtml(item.label)}</a>`
      }).join('')
    }
    
    // Mobile nav
    const mobileNav = document.querySelector('.mobile-nav')
    if (mobileNav) {
      mobileNav.innerHTML = items.map(item => {
        const isActive = currentPage === item.url || (currentPage === '' && item.url === 'index.html')
        // Use shorter label for mobile if available (first word or label)
        const mobileLabel = item.mobile_label || item.label
        return `<a href="${item.url}" class="${isActive ? 'active' : ''}">${escapeHtml(mobileLabel)}</a>`
      }).join('')
    }
  })
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// Auto-render on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderNavigation)
} else {
  renderNavigation()
}

window.loadNavigation = loadNavigation
window.saveNavItem = saveNavItem
window.deleteNavItem = deleteNavItem
window.renderNavigation = renderNavigation
