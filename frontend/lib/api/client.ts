/**
 * Shared fetch wrapper used by every module in lib/api/*.
 *
 * Responsibilities:
 *  - Resolve the backend base URL from NEXT_PUBLIC_API_URL (falls back to localhost:8000).
 *  - Serialize JSON bodies / query params.
 *  - Parse JSON responses.
 *  - Normalize failures (network errors, non-2xx responses, bad JSON) into a single
 *    typed `ApiError` so every page can render a consistent error state instead of crashing.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

/** Typed error thrown for any failed API call (network, HTTP, or parse failure). */
export class ApiError extends Error {
  /** HTTP status code, or 0 for network-level failures (e.g. backend not running). */
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface FetchApiOptions extends Omit<RequestInit, "body"> {
  /** Plain object body — will be JSON.stringify'd. Use `undefined` for no body. */
  body?: unknown;
  /** Query string params to append to the path. */
  query?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(
  path: string,
  query?: FetchApiOptions["query"]
): string {
  const url = new URL(
    path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
  );
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

/**
 * Generic typed fetch helper.
 *
 * Throws `ApiError` on any failure so callers can `catch` a single error type.
 * Callers are expected to catch this and surface a friendly EmptyState — never
 * let it bubble up and crash a page.
 */
export async function fetchApi<T>(
  path: string,
  options: FetchApiOptions = {}
): Promise<T> {
  const { body, query, headers, ...rest } = options;
  const url = buildUrl(path, query);

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      // Always fetch fresh data for this MVP dashboard — avoid stale cached reports.
      cache: "no-store",
    });
  } catch (err) {
    // Network-level failure: backend unreachable, DNS failure, CORS, etc.
    const message =
      err instanceof Error ? err.message : "Network request failed";
    throw new ApiError(
      `Could not reach the API at ${API_BASE_URL}. Is the backend running? (${message})`,
      0
    );
  }

  if (!response.ok) {
    let detail = "";
    try {
      const errBody = await response.json();
      detail =
        typeof errBody?.detail === "string"
          ? errBody.detail
          : typeof errBody?.message === "string"
          ? errBody.message
          : JSON.stringify(errBody);
    } catch {
      // response had no JSON body — fall back to status text
      detail = response.statusText;
    }
    throw new ApiError(
      `Request to ${path} failed (${response.status}): ${detail || "Unknown error"}`,
      response.status
    );
  }

  // Some endpoints (rare) may return no content.
  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("Failed to parse API response as JSON", response.status);
  }
}
