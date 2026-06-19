// i18n module - 8-language support with IP-based auto-detection

let currentLocale = 'zh'
let translations = {}

const LANG_CONFIG = {
  zh: { code: 'zh', label: '中文', flag: '🇨🇳' },
  en: { code: 'en', label: 'English', flag: '🇬🇧' },
  es: { code: 'es', label: 'Español', flag: '🇪🇸' },
  fr: { code: 'fr', label: 'Français', flag: '🇫🇷' },
  de: { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  ja: { code: 'ja', label: '日本語', flag: '🇯🇵' },
  ko: { code: 'ko', label: '한국어', flag: '🇰🇷' },
  ru: { code: 'ru', label: 'Русский', flag: '🇷🇺' }
}

const COUNTRY_TO_LANG = {
  CN: 'zh', HK: 'zh', TW: 'zh',
  US: 'en', GB: 'en', AU: 'en', CA: 'en', IE: 'en', NZ: 'en', ZA: 'en',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es', EC: 'es',
  FR: 'fr', BE: 'fr', CH: 'fr', LU: 'fr', MC: 'fr',
  DE: 'de', AT: 'de', LI: 'de',
  JP: 'ja',
  KR: 'ko',
  RU: 'ru', BY: 'ru', KZ: 'ru', UA: 'ru'
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
  const langMap = { zh: 'zh-CN', en: 'en', es: 'es', fr: 'fr', de: 'de', ja: 'ja', ko: 'ko', ru: 'ru' }
  document.documentElement.lang = langMap[currentLocale] || 'en'
  
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
  
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder
    const text = t(key)
    if (text) el.placeholder = text
  })
  
  document.querySelectorAll('[data-i18n-value]').forEach(el => {
    const key = el.dataset.i18nValue
    const text = t(key)
    if (text) el.value = text
  })
  
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
  
  const langOptions = Object.values(LANG_CONFIG).map(l => 
    `<div class="lang-option" data-lang="${l.code}" onclick="switchLanguage('${l.code}')">
      <span class="lang-flag">${l.flag}</span>
      <span class="lang-label">${l.label}</span>
    </div>`
  ).join('')
  
  div.innerHTML = `
    <style>
      .lang-switcher { position:fixed; top:1rem; right:1rem; z-index:9999; font-family:Inter,sans-serif; }
      .lang-switcher .lang-current { display:flex; align-items:center; gap:0.4rem; background:rgba(255,255,255,0.9); backdrop-filter:blur(4px); padding:0.4rem 0.9rem; border-radius:20px; box-shadow:0 2px 8px rgba(0,0,0,0.1); border:1px solid rgba(0,0,0,0.05); cursor:pointer; font-size:0.8rem; font-weight:600; color:#1a1a2e; transition:all 0.2s; }
      .lang-switcher .lang-current:hover { box-shadow:0 4px 12px rgba(0,0,0,0.15); }
      .lang-switcher .lang-current .arrow { font-size:0.6rem; transition:transform 0.2s; }
      .lang-switcher.open .lang-current .arrow { transform:rotate(180deg); }
      .lang-switcher .lang-dropdown { position:absolute; top:calc(100% + 0.4rem); right:0; background:#fff; border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,0.12); border:1px solid rgba(0,0,0,0.05); padding:0.4rem; min-width:140px; display:none; overflow:hidden; }
      .lang-switcher.open .lang-dropdown { display:block; }
      .lang-switcher .lang-option { display:flex; align-items:center; gap:0.5rem; padding:0.5rem 0.7rem; border-radius:8px; cursor:pointer; font-size:0.8rem; color:#4b5563; transition:all 0.15s; }
      .lang-switcher .lang-option:hover { background:#f1f5f9; }
      .lang-switcher .lang-option.active { background:#1a3a5c; color:#fff; }
      .lang-switcher .lang-flag { font-size:1rem; line-height:1; }
      .lang-switcher .lang-label { white-space:nowrap; }
      @media (max-width:768px) { .lang-switcher { top:0.5rem; right:0.5rem; } }
    </style>
    <div class="lang-current" onclick="toggleLangDropdown()">
      <span class="lang-current-flag">🇨🇳</span>
      <span class="lang-current-code">CN</span>
      <span class="arrow">▼</span>
    </div>
    <div class="lang-dropdown">${langOptions}</div>
  `
  document.body.appendChild(div)
  
  // Close dropdown when clicking outside
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
