// Stats module for admin dashboard

async function loadStats() {
  const sb = await getSupabase()
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  
  // Total page views
  const { data: totalViews } = await sb.from('page_views').select('*', { count: 'exact', head: true })
  const { data: todayViews } = await sb.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', today)
  const { data: monthViews } = await sb.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo)
  
  // Total likes
  const { data: totalLikes } = await sb.from('likes').select('*', { count: 'exact', head: true })
  
  // Total comments
  const { data: totalComments } = await sb.from('comments').select('*', { count: 'exact', head: true })
  const { data: pendingComments } = await sb.from('comments').select('*', { count: 'exact', head: true }).eq('status', 'pending')
  
  // Total works
  const { data: totalWorks } = await sb.from('works').select('*', { count: 'exact', head: true })
  
  return {
    totalViews: totalViews || 0,
    todayViews: todayViews || 0,
    monthViews: monthViews || 0,
    totalLikes: totalLikes || 0,
    totalComments: totalComments || 0,
    pendingComments: pendingComments || 0,
    totalWorks: totalWorks || 0
  }
}

async function loadRecentComments() {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('comments')
    .select('*, works(title)')
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) return []
  return data || []
}

async function loadRecentPageViews() {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('page_views')
    .select('page_path, created_at')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return []
  return data || []
}

async function approveComment(id) {
  const sb = await getSupabase()
  const { error } = await sb.from('comments').update({ status: 'approved' }).eq('id', id)
  return !error
}

async function deleteComment(id) {
  const sb = await getSupabase()
  const { error } = await sb.from('comments').delete().eq('id', id)
  return !error
}

async function deleteWork(id) {
  const sb = await getSupabase()
  const { error } = await sb.from('works').delete().eq('id', id)
  return !error
}

async function saveWork(workData) {
  const sb = await getSupabase()
  if (workData.id) {
    const { data, error } = await sb.from('works').update(workData).eq('id', workData.id).select()
    if (error) throw error
    return data
  } else {
    const { data, error } = await sb.from('works').insert(workData).select()
    if (error) throw error
    return data
  }
}

window.loadStats = loadStats
window.loadRecentComments = loadRecentComments
window.loadRecentPageViews = loadRecentPageViews
window.approveComment = approveComment
window.deleteComment = deleteComment
window.deleteWork = deleteWork
window.saveWork = saveWork

// ==================== LOGS ====================

async function loadLogs() {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('logs')
    .select('*')
    .order('log_date', { ascending: false })
  if (error) {
    console.error('loadLogs error:', error)
    return []
  }
  return data || []
}

async function saveLog(logData) {
  const sb = await getSupabase()
  // Parse media_urls from newline-separated text
  if (typeof logData.media_urls === 'string') {
    logData.media_urls = logData.media_urls
      .split('\n')
      .map(u => u.trim())
      .filter(Boolean)
  }
  if (typeof logData.tags === 'string') {
    logData.tags = logData.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
  }
  if (logData.id) {
    const { data, error } = await sb.from('logs').update(logData).eq('id', logData.id).select()
    if (error) throw error
    return data
  } else {
    const { data, error } = await sb.from('logs').insert(logData).select()
    if (error) throw error
    return data
  }
}

async function deleteLog(id) {
  const sb = await getSupabase()
  const { error } = await sb.from('logs').delete().eq('id', id)
  return !error
}

window.loadLogs = loadLogs
window.saveLog = saveLog
window.deleteLog = deleteLog
