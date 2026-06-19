// Supabase client configuration
const SUPABASE_URL = 'https://txaruompovbolumogggm.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4YXJ1b21wb3Zib2x1bW9nZ2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNzc4NjQsImV4cCI6MjA5Njk1Mzg2NH0.fyUp-xgE5PC5jxP6pptRU8PGaX25nE_lNWy5dkn4m9k'

let supabaseClient = null

async function getSupabase() {
  if (supabaseClient) return supabaseClient
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.0')
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY)
  return supabaseClient
}

// Admin auth
async function adminLogin(email, password) {
  const sb = await getSupabase()
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error) throw error
  localStorage.setItem('admin_session', JSON.stringify(data.session))
  return data
}

async function getAdminSession() {
  const raw = localStorage.getItem('admin_session')
  if (!raw) return null
  const session = JSON.parse(raw)
  const sb = await getSupabase()
  const { data: { user } } = await sb.auth.getUser(session.access_token)
  if (!user) {
    localStorage.removeItem('admin_session')
    return null
  }
  sb.auth.setSession(session)
  return { session, user }
}

function adminLogout() {
  localStorage.removeItem('admin_session')
  location.href = 'admin-login.html'
}

// Log page view
async function logPageView(pagePath) {
  try {
    const sb = await getSupabase()
    await sb.from('page_views').insert({
      page_path: pagePath,
      ip_address: 'anonymous',
      user_agent: navigator.userAgent.substring(0, 200)
    })
  } catch (e) { /* silent */ }
}

// Export
window.getSupabase = getSupabase
window.adminLogin = adminLogin
window.getAdminSession = getAdminSession
window.adminLogout = adminLogout
window.logPageView = logPageView
