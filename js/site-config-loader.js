// Load site config from Supabase and override page content
(async function() {
  try {
    const SUPABASE_URL = 'https://txaruompovbolumogggm.supabase.co'
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4YXJ1b21wb3Zib2x1bW9nZ2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNzc4NjQsImV4cCI6MjA5Njk1Mzg2NH0.fyUp-xgE5PC5jxP6pptRU8PGaX25nE_lNWy5dkn4m9k'
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.0')
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
    
    // Detect current language
    const savedLang = localStorage.getItem('i18n_lang')
    const lang = (savedLang === 'en') ? 'en' : 'zh'
    
    const { data, error } = await sb.from('site_config').select('*').eq('lang', lang)
    if (error || !data || data.length === 0) return
    
    data.forEach(row => {
      // Find elements with matching data-i18n key
      document.querySelectorAll(`[data-i18n="${row.key}"]`).forEach(el => {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (el.placeholder !== undefined) el.placeholder = row.value
          else el.value = row.value
        } else {
          el.textContent = row.value
        }
        el.dataset.i18nFallback = row.value
      })
      
      // Also try data-i18n-placeholder and data-i18n-value
      document.querySelectorAll(`[data-i18n-placeholder="${row.key}"]`).forEach(el => {
        el.placeholder = row.value
      })
      document.querySelectorAll(`[data-i18n-value="${row.key}"]`).forEach(el => {
        el.value = row.value
      })
    })
  } catch (e) {
    // Silently ignore if Supabase is not available or table doesn't exist
  }
})()
