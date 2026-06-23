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
  const container = document.querySelector('.side-nav .nav-links')
  if (!container) return
  // Default navigation
  const defaultNav = [
    { label: 'Home', href: 'index.html', key: 'nav.home' },
    { label: 'Daily Log', href: 'about.html', key: 'nav.about' },
    { label: 'Portfolio', href: 'portfolio.html', key: 'nav.portfolio' },
    { label: 'Contact', href: 'contact.html', key: 'nav.contact' }
  ]
  const currentPath = window.location.pathname.split('/').pop() || 'index.html'
  container.innerHTML = defaultNav.map(item => {
    const isActive = currentPath === item.href || (currentPath === '' && item.href === 'index.html')
    return `<a href="${item.href}" class="${isActive ? 'active' : ''}" data-i18n="${item.key}">${item.label}</a>`
  }).join('')
}

// Check if running in admin context
if (typeof window !== 'undefined' && !document.querySelector('.admin-panel')) {
  renderNavigation()
} else {
  renderNavigation()
}

window.loadNavigation = loadNavigation
window.saveNavItem = saveNavItem
window.deleteNavItem = deleteNavItem
window.renderNavigation = renderNavigation

// ===== CUSTOM CURSOR =====
(function initCursor() {
  const dot = document.querySelector('.cursor-dot')
  const ring = document.querySelector('.cursor-ring')
  if (!dot || !ring) return
  let mx = 0, my = 0, rx = 0, ry = 0
  document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY
    dot.style.left = mx + 'px'
    dot.style.top = my + 'px'
  })
  function tick() {
    rx += (mx - rx) * 0.15
    ry += (my - ry) * 0.15
    ring.style.left = rx + 'px'
    ring.style.top = ry + 'px'
    requestAnimationFrame(tick)
  }
  tick()
  const interactive = document.querySelectorAll('a, button, .portfolio-item, .play-btn, .work-card, .log-like-btn, .log-comment-toggle, .side-nav-toggle')
  interactive.forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('hovering'))
    el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'))
  })
})()

// ===== SCROLL REVEAL =====
(function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('revealed')
    })
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })
  document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el))
  // Also observe dynamically added elements
  const dynObserver = new MutationObserver(() => {
    document.querySelectorAll('.scroll-reveal:not(.revealed)').forEach(el => {
      if (!el.__observed) { observer.observe(el); el.__observed = true }
    })
  })
  dynObserver.observe(document.body, { childList: true, subtree: true })
})()
