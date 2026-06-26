// i18n module - Chinese & English bilingual support

let currentLocale = 'zh'
let translations = {}

const LANG_CONFIG = {
  zh: { code: 'zh', label: '中文', flag: '🇨🇳' },
  en: { code: 'en', label: 'English', flag: '🇬🇧' }
}

const COUNTRY_TO_LANG = {
  CN: 'zh', HK: 'zh', TW: 'zh',
  US: 'en', GB: 'en', AU: 'en', CA: 'en', IE: 'en', NZ: 'en', ZA: 'en'
}

async function initI18n() {
  const saved = localStorage.getItem('i18n_lang')
  if (saved && LANG_CONFIG[saved]) {
    currentLocale = saved
  } else {
    try {
      const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        currentLocale = COUNTRY_TO_LANG[data.country] || 'en'
      }
    } catch (e) {
      currentLocale = 'en'
    }
  }
  
  await loadTranslations(currentLocale)
  applyTranslations()
  injectLangSwitcher()
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
  const langMap = { zh: 'zh-CN', en: 'en' }
  document.documentElement.lang = langMap[currentLocale] || 'en'
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n
    const fallback = el.dataset.i18nFallback || el.textContent
    const text = t(key, fallback)
    if (text && text !== key) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.placeholder !== undefined) el.placeholder = text
        else el.value = text
      } else {
        el.textContent = text
      }
    }
  })
  
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder
    const fallback = el.placeholder
    const text = t(key, fallback)
    if (text && text !== key) el.placeholder = text
  })
  
  document.querySelectorAll('[data-i18n-value]').forEach(el => {
    const key = el.dataset.i18nValue
    const fallback = el.value
    const text = t(key, fallback)
    if (text && text !== key) el.value = text
  })
  
  const titleKey = document.querySelector('title')?.dataset.i18n
  if (titleKey) {
    const titleText = t(titleKey)
    if (titleText && titleText !== titleKey) document.title = titleText
  }
}

function injectLangSwitcher() {
  if (document.getElementById('lang-switcher')) return
  
  const div = document.createElement('div')
  div.id = 'lang-switcher'
  div.className = 'lang-switcher'
  
  const langOptions = Object.values(LANG_CONFIG).map(l => 
    `<div class="lang-option" data-lang="${l.code}" onclick="switchLanguage('${l.code}')">
      <span class="lang-flag">${l.flag}</span>
      <span class="lang-label">${l.label}</span>
    </div>`
  ).join('')
  
  div.innerHTML = `
    <style>
      .lang-switcher { position:fixed; bottom:1rem; right:1rem; z-index:9999; font-family:Inter,sans-serif; opacity:0.4; transition:opacity 0.3s ease; }
      .lang-switcher:hover { opacity:1; }
      .lang-switcher .lang-current { display:flex; align-items:center; gap:0.4rem; background:rgba(255,255,255,0.85); backdrop-filter:blur(4px); padding:0.4rem 0.9rem; border-radius:20px; box-shadow:0 2px 8px rgba(0,0,0,0.1); border:1px solid rgba(0,0,0,0.05); cursor:pointer; font-size:0.8rem; font-weight:600; color:#1a1a2e; transition:all 0.2s; }
      .lang-switcher:hover .lang-current { box-shadow:0 4px 12px rgba(0,0,0,0.15); background:rgba(255,255,255,0.95); }
      .lang-switcher .lang-current .arrow { font-size:0.6rem; transition:transform 0.2s; opacity:0; transition:opacity 0.2s, transform 0.2s; }
      .lang-switcher:hover .lang-current .arrow { opacity:1; }
      .lang-switcher.open .lang-current .arrow { transform:rotate(180deg); opacity:1; }
      .lang-switcher .lang-dropdown { position:absolute; bottom:calc(100% + 0.4rem); right:0; background:rgba(255,255,255,0.95); backdrop-filter:blur(8px); border-radius:12px; box-shadow:0 -8px 24px rgba(0,0,0,0.12); border:1px solid rgba(0,0,0,0.05); padding:0.4rem; min-width:140px; display:none; overflow:hidden; }
      .lang-switcher.open .lang-dropdown { display:block; }
      .lang-switcher .lang-option { display:flex; align-items:center; gap:0.5rem; padding:0.5rem 0.7rem; border-radius:8px; cursor:pointer; font-size:0.8rem; color:#4b5563; transition:all 0.15s; }
      .lang-switcher .lang-option:hover { background:#f1f5f9; }
      .lang-switcher .lang-option.active { background:#1a3a5c; color:#fff; }
      .lang-switcher .lang-flag { font-size:1rem; line-height:1; }
      .lang-switcher .lang-label { white-space:nowrap; }
    </style>
    <div class="lang-current" onclick="toggleLangDropdown()">
      <span class="lang-current-flag">🇨🇳</span>
      <span class="lang-current-code">CN</span>
      <span class="arrow">▼</span>
    </div>
    <div class="lang-dropdown">${langOptions}</div>
  `
  document.body.appendChild(div)
  
  document.addEventListener('click', (e) => {
    if (!div.contains(e.target)) div.classList.remove('open')
  })
}

function toggleLangDropdown() {
  const el = document.getElementById('lang-switcher')
  if (el) el.classList.toggle('open')
}

async function switchLanguage(lang) {
  if (!LANG_CONFIG[lang]) return
  currentLocale = lang
  localStorage.setItem('i18n_lang', lang)
  await loadTranslations(lang)
  applyTranslations()
  updateLangSwitcher()
  const el = document.getElementById('lang-switcher')
  if (el) el.classList.remove('open')
}

function updateLangSwitcher() {
  const config = LANG_CONFIG[currentLocale]
  if (!config) return
  const currentEl = document.querySelector('.lang-switcher .lang-current')
  if (currentEl) {
    currentEl.querySelector('.lang-current-flag').textContent = config.flag
    currentEl.querySelector('.lang-current-code').textContent = config.code.toUpperCase()
  }
  document.querySelectorAll('.lang-switcher .lang-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.lang === currentLocale)
  })
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

window.initI18n = initI18n
window.switchLanguage = switchLanguage
window.toggleLangDropdown = toggleLangDropdown
window.t = t
window.applyTranslations = applyTranslations
