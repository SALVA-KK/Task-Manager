const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const TOKEN_KEY = "tm_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(message, status, fieldErrors = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

// Turn a DRF error body into a message plus per-field errors.
function parseError(body) {
  if (!body || typeof body !== "object") {
    return { message: "Something went wrong.", fieldErrors: {} };
  }
  if (body.detail) return { message: body.detail, fieldErrors: {} };
  const fieldErrors = {};
  for (const [field, msgs] of Object.entries(body)) {
    fieldErrors[field] = Array.isArray(msgs) ? msgs.join(" ") : String(msgs);
  }
  return { message: "Please fix the highlighted fields.", fieldErrors };
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

export async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Token ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Is the backend running?", 0);
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (res.ok) return data;

  const { message, fieldErrors } = parseError(data);
  // Token expired or revoked on a protected call: log the user out.
  if (res.status === 401 && token && !path.startsWith("/auth/login")) onUnauthorized();
  throw new ApiError(message, res.status, fieldErrors);
}

export const api = {
  signup: (email, password) =>
    request("/auth/signup/", { method: "POST", body: { email, password } }),
  login: (email, password) =>
    request("/auth/login/", { method: "POST", body: { email, password } }),
  logout: () => request("/auth/logout/", { method: "POST" }),
};