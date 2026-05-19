const cfg = require('./config');

const providerState = new Map();

function getThreshold() {
  const raw = Number(cfg.appConfig.provider_circuit_fail_threshold);
  if (Number.isFinite(raw) && raw >= 0) return raw;
  return 3;
}

function getCooldownMs() {
  const raw = Number(cfg.appConfig.provider_circuit_cooldown_ms);
  if (Number.isFinite(raw) && raw >= 0) return raw;
  return 60000;
}

function getKey(serviceType, providerCode) {
  return `${String(serviceType || '').toLowerCase()}::${String(providerCode || '').toLowerCase()}`;
}

function createState(serviceType, providerCode) {
  return {
    service_type: String(serviceType || '').toLowerCase(),
    provider_code: String(providerCode || '').toLowerCase(),
    requests: 0,
    successes: 0,
    failures: 0,
    timeouts: 0,
    skipped_open: 0,
    circuit_open_count: 0,
    consecutive_failures: 0,
    total_latency_ms: 0,
    last_latency_ms: 0,
    last_error: '',
    last_error_type: '',
    last_success_at: null,
    last_failure_at: null,
    circuit_open_until: 0
  };
}

function getState(serviceType, providerCode) {
  const key = getKey(serviceType, providerCode);
  if (!providerState.has(key)) {
    providerState.set(key, createState(serviceType, providerCode));
  }
  return providerState.get(key);
}

function isCircuitOpen(serviceType, providerCode) {
  if (getThreshold() <= 0) return false;
  const state = getState(serviceType, providerCode);
  if (!state.circuit_open_until) return false;
  if (Date.now() >= state.circuit_open_until) {
    state.circuit_open_until = 0;
    return false;
  }
  return true;
}

function markSkippedOpen(serviceType, providerCode) {
  const state = getState(serviceType, providerCode);
  state.skipped_open += 1;
}

function recordSuccess(serviceType, providerCode, latencyMs) {
  const state = getState(serviceType, providerCode);
  const duration = Number.isFinite(Number(latencyMs)) ? Number(latencyMs) : 0;
  state.requests += 1;
  state.successes += 1;
  state.consecutive_failures = 0;
  state.last_latency_ms = duration;
  state.total_latency_ms += duration;
  state.last_success_at = new Date().toISOString();
  state.last_error = '';
  state.last_error_type = '';
  state.circuit_open_until = 0;
}

function recordFailure(serviceType, providerCode, details = {}) {
  const state = getState(serviceType, providerCode);
  const duration = Number.isFinite(Number(details.latencyMs)) ? Number(details.latencyMs) : 0;
  const errorType = String(details.errorType || 'failure');
  const errorMessage = String(details.errorMessage || '');

  state.requests += 1;
  state.failures += 1;
  state.consecutive_failures += 1;
  state.last_latency_ms = duration;
  state.total_latency_ms += duration;
  state.last_failure_at = new Date().toISOString();
  state.last_error = errorMessage;
  state.last_error_type = errorType;

  if (errorType === 'timeout') {
    state.timeouts += 1;
  }

  const threshold = getThreshold();
  if (threshold > 0 && state.consecutive_failures >= threshold) {
    state.circuit_open_until = Date.now() + getCooldownMs();
    state.circuit_open_count += 1;
  }
}

function getProviderMetricsSnapshot(serviceType = null) {
  const now = Date.now();
  return Array.from(providerState.values())
    .filter((item) => !serviceType || item.service_type === String(serviceType).toLowerCase())
    .map((item) => ({
      service_type: item.service_type,
      provider_code: item.provider_code,
      requests: item.requests,
      successes: item.successes,
      failures: item.failures,
      timeouts: item.timeouts,
      skipped_open: item.skipped_open,
      circuit_open_count: item.circuit_open_count,
      consecutive_failures: item.consecutive_failures,
      success_rate: item.requests > 0 ? Number(((item.successes / item.requests) * 100).toFixed(2)) : 0,
      avg_latency_ms: item.requests > 0 ? Number((item.total_latency_ms / item.requests).toFixed(2)) : 0,
      last_latency_ms: item.last_latency_ms,
      last_error: item.last_error,
      last_error_type: item.last_error_type,
      last_success_at: item.last_success_at,
      last_failure_at: item.last_failure_at,
      circuit_open: !!(item.circuit_open_until && item.circuit_open_until > now),
      circuit_open_until: item.circuit_open_until ? new Date(item.circuit_open_until).toISOString() : null
    }))
    .sort((a, b) => a.service_type.localeCompare(b.service_type) || a.provider_code.localeCompare(b.provider_code));
}

function resetProviderMetrics(serviceType = null) {
  const normalized = serviceType ? String(serviceType).toLowerCase() : null;
  if (!normalized) {
    providerState.clear();
    return { reset: 'all' };
  }
  for (const [key, value] of providerState.entries()) {
    if (value.service_type === normalized) {
      providerState.delete(key);
    }
  }
  return { reset: normalized };
}

module.exports = {
  isCircuitOpen,
  markSkippedOpen,
  recordSuccess,
  recordFailure,
  getProviderMetricsSnapshot,
  resetProviderMetrics
};
