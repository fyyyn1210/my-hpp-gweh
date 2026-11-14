import { API_URL, DEFAULT_ERROR, ERROR_MESSAGES, MS_PER_DAY, TODAY } from "./constants";
import { state } from "./state";

export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
  ) {
    super(code);
  }
}

export const errorText = (error: unknown) => (error instanceof ApiError && ERROR_MESSAGES[error.code]) || DEFAULT_ERROR;

const BASE_HEADERS = { "Content-Type": "application/json", "ngrok-skip-browser-warning": "1" };

const send = (path: string, method: string, body?: unknown) => {
  const form = body instanceof FormData;
  const { "Content-Type": json, ...base } = BASE_HEADERS;
  return fetch(`${API_URL}${path}`, {
    method,
    headers: { ...base, ...(form ? {} : { "Content-Type": json }), ...(state.accessToken ? { Authorization: `Bearer ${state.accessToken}` } : {}) },
    body: body === undefined ? undefined : form ? body : JSON.stringify(body),
  }).catch(() => {
    throw new ApiError("NETWORK_ERROR", 0);
  });
};

let renewing: Promise<boolean> | null = null;

const renew = () =>
  (renewing ??= (async () => {
    if (!state.refreshToken) return false;
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: BASE_HEADERS,
      body: JSON.stringify({ refreshToken: state.refreshToken }),
    }).catch(() => null);
    if (!res?.ok) return false;
    const { data } = await res.json();
    Object.assign(state, { accessToken: data.accessToken, refreshToken: data.refreshToken });
    return true;
  })().finally(() => (renewing = null)));

const authed = async (path: string, method: string, body?: unknown) => {
  const res = await send(path, method, body);
  return res.status === 401 && state.accessToken && (await renew()) ? send(path, method, body) : res;
};

const fail = (res: Response, json: { message?: string } | null) => {
  if (res.status === 401 && state.accessToken) {
    Object.assign(state, { session: null, accessToken: null, refreshToken: null });
    location.hash = "#/masuk";
  }
  return new ApiError(json?.message ?? "UNKNOWN_ERROR", res.status);
};

export const api = async <T>(path: string, method = "GET", body?: unknown): Promise<T> => {
  const res = await authed(path, method, body);
  const json = await res.json().catch(() => null);
  if (!res.ok) throw fail(res, json);
  return json.data as T;
};

export const stream = async (path: string, body: unknown, onEvent: (event: string, data: any) => void) => {
  const res = await authed(path, "POST", body);
  if (!res.ok || !res.body) throw fail(res, await res.json().catch(() => null));
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += value;
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const event = part.match(/^event: (.*)$/m)?.[1];
      const data = part.match(/^data: (.*)$/m)?.[1];
      if (event && data) onEvent(event, JSON.parse(data));
    }
  }
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export const dayOf = (iso: string | Date) => TODAY - Math.round((startOfDay(new Date()) - startOfDay(new Date(iso))) / MS_PER_DAY);
