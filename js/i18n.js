// i18n module - multi-language support with auto-detection by IP

let currentLocale = 'zh'
let translations = {}

async function initI18n() {
  // 1. Check saved preference
  const saved = localStorage.getItem('i18n_lang')
  if (saved && ['zh', 'en'].includes(saved)) {
    currentLocale = saved
  } else {
    // 2. Auto-detect by IP
    try {
      const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        currentLocale = (data.country === 'CN') ? 'zh' : 'en'
      }
    } catch (e) {
      currentLocale = 'zh' // fallback
    }
  }
  
  // 3. Load translations
  await loadTranslations(currentLocale)
  
  // 4. Apply to page
  applyTranslations()
  
  // 5. Inject language switcher
  injectLangSwitcher()
  
  // 6. Update lang switcher UI
  updateLangSwitcher()
}

async function loadTranslations(lang) {
  try {
    const res = await fetch(`locales/${lang}.json`)
    if (res.ok) {
      translations = await res.json()
    }
  } catch (e) {
    console.error('Failed to load translations:', e)
  }
}

function t(key, fallback = '') {
  const keys = key.split('.')
  let val = translations
  for (const k of keys) {
    val = val?.[k]
    if (val === undefined) return fallback || key
  }
  return val
}

function applyTranslations() {
  document.documentElement.lang = currentLocale === 'zh' ? 'zh-CN' : 'en'
  
  // Update all elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n
    const text = t(key)
    if (text) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.placeholder !== undefined) el.placeholder = text
        else el.value = text
      } else {
        el.textContent = text
      }
    }
  })
  
  // Update elements with data-i18n-placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder
    const text = t(key)
    if (text) el.placeholder = text
  })
  
  // Update elements with data-i18n-value
  document.querySelectorAll('[data-i18n-value]').forEach(el => {
    const key = el.dataset.i18nValue
    const text = t(key)
    if (text) el.value = text
  })
  
  // Update title
  const titleKey = document.querySelector('title')?.dataset.i18n
  if (titleKey) {
    const titleText = t(titleKey)
    if (titleText) document.title = titleText
  }
}

function injectLangSwitcher() {
  if (document.getElementById('lang-switcher')) return
  
  const div = document.createElement('div')
  div.id = 'lang-switcher'
  div.className = 'lang-switcher'
  div.innerHTML = `
    <style>
      .lang-switcher { position:fixed; top:1rem; right:1rem; z-index:9999; display:flex; gap:0.3rem; background:rgba(255,255,255,0.9); backdrop-filter:blur(4px); padding:0.3rem; border-radius:20px; box-shadow:0 2px 8px rgba(0,0,0,0.1); border:1px solid rgba(0,0,0,0.05); }
      .lang-switcher .lang-btn { background:transparent; border:none; padding:0.3rem 0.7rem; border-radius:14px; font-size:0.75rem; font-weight:600; cursor:pointer; color:#6b7280; transition:all 0.2s; font-family:Inter,sans-serif; }
      .lang-switcher .lang-btn:hover { color:#1a3a5c; }
      .lang-switcher .lang-btn.active { background:#1a3a5c; color:#fff; }
      @media (max-width:768px) { .lang-switcher { top:0.5rem; right:0.5rem; } }
    </style>
    <button class="lang-btn" data-lang="zh" onclick="switchLanguage('zh')">CN</button>
    <button class="lang-btn" data-lang="en" onclick="switchLanguage('en')">EN</button>
  `
  document.body.appendChild(div)
}

async function switchLanguage(lang) {
  if (!['zh', 'en'].includes(lang)) return
  currentLocale = lang
  localStorage.setItem('i18n_lang', lang)
  await loadTranslations(lang)
  applyTranslations()
  updateLangSwitcher()
}

function updateLangSwitcher() {
  document.querySelectorAll('.lang-switcher .lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLocale)
  })
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

window.initI18n = initI18n
window.switchLanguage = switchLanguage
window.t = t
window.applyTranslations = applyTranslations
