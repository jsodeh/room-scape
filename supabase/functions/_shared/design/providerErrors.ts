// Never retain raw SDK errors: they may contain request bodies, headers or keys.
export interface ProviderDiagnostic {
  httpStatus?: number;
  status?: string;
  reason?: string;
  retryAfterSeconds?: number;
  quotas?: {
    metric?: string;
    id?: string;
    model?: string;
    location?: string;
    value?: number;
  }[];
}
type RecordValue = Record<string, unknown>;
function object(value: unknown): RecordValue {
  if (typeof value === "string" && value.length <= 65536) {
    try {
      value = JSON.parse(value);
    } catch {
      return {};
    }
  }
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as RecordValue
    : {};
}
export function statusOf(error: unknown) {
  const e = object(error);
  return Number(e.status || e.statusCode || object(e.response).status);
}
function allowed(value: unknown, pattern: RegExp) {
  const key = Deno.env.get("GEMINI_API_KEY");
  return typeof value === "string" && pattern.test(value) &&
      (!key || !value.includes(key))
    ? value
    : undefined;
}
export function providerDiagnostic(error: unknown): ProviderDiagnostic {
  const e = object(error), diagnostic: ProviderDiagnostic = {};
  const httpStatus = statusOf(error);
  if (httpStatus >= 400 && httpStatus <= 599) {
    diagnostic.httpStatus = httpStatus;
  }
  let payload: RecordValue = {};
  for (const source of [e.error, e.body, e.message]) {
    const candidate = object(source);
    const inner = Object.keys(object(candidate.error)).length
      ? object(candidate.error)
      : candidate;
    if (inner.status || Array.isArray(inner.details)) {
      payload = inner;
      break;
    }
  }
  const status = allowed(
    payload.status,
    /^(RESOURCE_EXHAUSTED|INVALID_ARGUMENT|PERMISSION_DENIED|UNAUTHENTICATED|NOT_FOUND|UNAVAILABLE|DEADLINE_EXCEEDED|INTERNAL|UNKNOWN)$/,
  );
  if (status) diagnostic.status = status;
  for (const detail of Array.isArray(payload.details) ? payload.details : []) {
    const item = object(detail), type = item["@type"];
    if (type === "type.googleapis.com/google.rpc.ErrorInfo") {
      const reason = allowed(
        item.reason,
        /^(BILLING_DISABLED|PROJECT_BILLING_DISABLED|API_KEY_INVALID|API_KEY_SERVICE_BLOCKED|SERVICE_DISABLED|RATE_LIMIT_EXCEEDED|ACCESS_TOKEN_SCOPE_INSUFFICIENT|CONSUMER_INVALID)$/,
      );
      if (reason) diagnostic.reason = reason;
    }
    if (type === "type.googleapis.com/google.rpc.RetryInfo") {
      const seconds = typeof item.retryDelay === "string" &&
          /^\d+(\.\d+)?s$/.test(item.retryDelay)
        ? Number.parseFloat(item.retryDelay)
        : NaN;
      if (Number.isFinite(seconds) && seconds >= 0) {
        diagnostic.retryAfterSeconds = Math.min(86400, Math.ceil(seconds));
      }
    }
    if (
      type === "type.googleapis.com/google.rpc.QuotaFailure" &&
      Array.isArray(item.violations)
    ) {
      const quotas = item.violations.slice(0, 12).map((violation) => {
        const v = object(violation), dimensions = object(v.quotaDimensions);
        const quota: NonNullable<ProviderDiagnostic["quotas"]>[number] = {};
        const metric = allowed(
          v.quotaMetric,
          /^generativelanguage\.googleapis\.com\/[a-zA-Z0-9_./-]{1,160}$/,
        );
        const id = allowed(v.quotaId, /^Generate[a-zA-Z0-9_-]{1,180}$/);
        const model = allowed(
          dimensions.model,
          /^(models\/)?gemini-[a-zA-Z0-9_.-]{1,100}$/,
        );
        const location = allowed(dimensions.location, /^[a-z][a-z0-9-]{0,40}$/);
        if (metric) quota.metric = metric;
        if (id) quota.id = id;
        if (model) quota.model = model;
        if (location) quota.location = location;
        if (
          typeof v.quotaValue === "number" ||
          typeof v.quotaValue === "string" && /^\d+$/.test(v.quotaValue)
        ) {
          const value = Number(v.quotaValue);
          if (Number.isSafeInteger(value) && value >= 0) quota.value = value;
        }
        return quota;
      }).filter((q) => Object.keys(q).length);
      if (quotas.length) diagnostic.quotas = quotas;
    }
  }
  return diagnostic;
}
export class ProviderFailure extends Error {
  constructor(
    public code: string,
    message: string,
    public uncertain = false,
    public diagnostics: ProviderDiagnostic = {},
  ) {
    super(message);
    this.name = "ProviderFailure";
  }
}
export function classifyProviderError(
  error: unknown,
  dispatched: boolean,
  operation: "generation" | "analysis" = "generation",
) {
  const d = providerDiagnostic(error), status = d.httpStatus;
  const failure = (code: string, message: string, uncertain = false) =>
    new ProviderFailure(code, message, uncertain, d);
  if (
    d.reason === "BILLING_DISABLED" || d.reason === "PROJECT_BILLING_DISABLED"
  ) {
    return failure(
      "provider_billing",
      "Google reports billing is disabled for the Gemini project. Enable billing for the project that owns the API key.",
    );
  }
  if (
    d.reason === "API_KEY_INVALID" || d.reason === "API_KEY_SERVICE_BLOCKED" ||
    d.reason === "SERVICE_DISABLED"
  ) {
    return failure(
      "provider_access",
      "Google rejected the Gemini API configuration. Check the key, API restrictions and whether the Gemini API is enabled.",
    );
  }
  if (status === 429) {
    const zero = d.quotas?.some((q) => q.value === 0);
    const free = d.quotas?.some((q) =>
      q.metric?.includes("free_tier") || q.id?.endsWith("FreeTier")
    );
    const delay = d.retryAfterSeconds;
    const retry = !zero && delay
      ? ` Google suggests waiting ${
        delay >= 3600
          ? `about ${Math.ceil(delay / 3600)} hours`
          : delay >= 60
          ? `about ${Math.ceil(delay / 60)} minutes`
          : `${delay} seconds`
      }; check the quota allocation before trying again.`
      : "";
    return failure(
      "provider_quota",
      zero
        ? `Google reports zero available quota for this ${operation} model (HTTP 429). Check its AI Studio project quota and billing. No automatic retry was made.`
        : `${
          free
            ? `Google refused this ${operation} request under its free-tier quota (HTTP 429). Check the daily and per-minute limits in AI Studio.`
            : `Google rejected this ${operation} request with HTTP 429 (quota or rate limit). Check the AI Studio project quota and billing.`
        } No automatic retry was made.${retry}`,
    );
  }
  if (status === 401 || status === 403) {
    return failure(
      "provider_access",
      "The Gemini key is not authorized for this operation. Check its project, API access and billing.",
    );
  }
  if (status === 404) {
    return failure(
      "model_unavailable",
      operation === "analysis"
        ? "Google could not find the configured analysis model (HTTP 404). The image-generation model selector does not control analysis."
        : "The selected Gemini model is unavailable to this project.",
    );
  }
  if (status === 400 || status === 422) {
    return failure(
      "provider_request",
      `Google rejected the ${operation} request format (HTTP ${status}). Your saved design is unchanged.`,
    );
  }
  if (status === 408 || status === 504) {
    return failure(
      "provider_timeout",
      `Google timed out while processing this ${operation} request (HTTP ${status}). No automatic retry was made.`,
      dispatched,
    );
  }
  return failure(
    "provider_outcome_unknown",
    dispatched
      ? "Generation was interrupted. Its outcome may be unknown; review before retrying to avoid another charge."
      : `Gemini could not complete the ${operation} request. Your room instructions and saved design are unchanged.`,
    dispatched,
  );
}
export function providerHTTPStatus(error: ProviderFailure) {
  if (error.diagnostics.httpStatus === 429) return 429;
  if (error.code === "provider_timeout") return 504;
  return [
      "provider_access",
      "provider_billing",
      "provider_not_configured",
      "model_unavailable",
    ].includes(error.code)
    ? 503
    : 502;
}
