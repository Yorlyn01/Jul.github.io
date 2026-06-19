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

// Update admin password
async function updateAdminPassword(newPassword) {
  const sb = await getSupabase()
  const { data, error } = await sb.auth.updateUser({ password: newPassword })
  if (error) throw error
  // Update stored session with new tokens
  if (data.session) {
    localStorage.setItem('admin_session', JSON.stringify(data.session))
  }
  return data
}

// Upload media file to Supabase Storage
async function uploadMedia(file, path) {
  const sb = await getSupabase()
  // Sanitize filename: remove non-ASCII chars and spaces
  const safeName = (file.name || 'file')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9.\-_]/g, '')
  const filePath = path || `${Date.now()}-${safeName}`
  const { data, error } = await sb.storage
    .from('media')
    .upload(filePath, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  // Get public URL
  const { data: { publicUrl } } = sb.storage
    .from('media')
    .getPublicUrl(data.path)
  return { publicUrl, path: data.path, filePath }
}

// Get public URL for a media file
function getMediaUrl(path) {
  const sb = supabaseClient
  if (!sb) return null
  const { data: { publicUrl } } = sb.storage.from('media').getPublicUrl(path)
  return publicUrl
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
window.updateAdminPassword = updateAdminPassword
window.uploadMedia = uploadMedia
window.getMediaUrl = getMediaUrl
window.logPageView = logPageView
