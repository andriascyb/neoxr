function escapeHtml(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;');
}

function buildAdminRenderContext(ADMIN_KEY, appStats, req) {
  const serviceKeys = ['bank', 'ewallet', 'nik', 'whatsapp', 'games', 'bpjs', 'pln', 'ai'];
  const getTodayMetric = (service, metric) => {
    const s = (appStats && appStats[service] && appStats[service].today) ? appStats[service].today : {};
    return Number(s[metric] || 0);
  };
  const todayTotal = serviceKeys.reduce((sum, service) => sum + getTodayMetric(service, 'total'), 0);
  const todayValid = serviceKeys.reduce((sum, service) => sum + getTodayMetric(service, 'valid'), 0);

  return {
    ADMIN_KEY,
    appStats,
    req,
    esc: escapeHtml,
    savedMsg: req.query.saved
      ? '<div class="alert alert-success alert-dismissible fade show" role="alert"><i class="bi bi-check-circle-fill me-2"></i>Pengaturan berhasil disimpan!<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>'
      : '',
    todayTotal,
    todayValid,
    validRate: todayTotal > 0 ? Math.round(todayValid / todayTotal * 100) : 0
  };
}

module.exports = {
  escapeHtml,
  buildAdminRenderContext
};
