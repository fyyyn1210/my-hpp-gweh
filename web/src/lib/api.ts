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

const send = (path: string, method: string, body?: unknown) =>
  fetch(`${API_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(state.accessToken ? { Authorization: `Bearer ${state.accessToken}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => {
    throw new ApiError("NETWORK_ERROR", 0);
  });

let renewing: Promise<boolean> | null = null;

const renew = () =>
  (renewing ??= (async () => {
    if (!state.refreshToken) return false;
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: state.refreshToken }),
    }).catch(() => null);
    if (!res?.ok) return false;
    const { data } = await res.json();
    Object.assign(state, { accessToken: data.accessToken, refreshToken: data.refreshToken });
    return true;
  })().finally(() => (renewing = null)));

export const api = async <T>(path: string, method = "GET", body?: unknown): Promise<T> => {
  let res = await send(path, method, body);
  if (res.status === 401 && state.accessToken && (await renew())) res = await send(path, method, body);
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && state.accessToken) {
      Object.assign(state, { session: null, accessToken: null, refreshToken: null });
      location.hash = "#/masuk";
    }
    throw new ApiError(json?.message ?? "UNKNOWN_ERROR", res.status);
  }
  return json.data as T;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export const dayOf = (iso: string | Date) => TODAY - Math.round((startOfDay(new Date()) - startOfDay(new Date(iso))) / MS_PER_DAY);
