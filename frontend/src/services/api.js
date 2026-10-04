import axios from "axios";

const http = axios.create({ baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`, timeout: 12000, withCredentials: true });

let refreshing = null;
http.interceptors.response.use(null, async (error) => {
  const cfg = error.config;
  const url = cfg?.url || "";
  if (error.response?.status === 401 && !cfg._retry && !url.startsWith("/auth/")) {
    cfg._retry = true;
    try {
      refreshing = refreshing || http.post("/auth/refresh").finally(() => { refreshing = null; });
      await refreshing;
      return http(cfg);
    } catch { /* fall through */ }
  }
  return Promise.reject(error);
});

export const errorMessage = (e) => {
  const detail = e.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d?.msg || JSON.stringify(d)).join(" ");
  return e.response ? `Request failed (${e.response.status})` : "Backend unavailable";
};

const unwrap = (p) => p.then((r) => r.data).catch((e) => {
  const err = new Error(errorMessage(e));
  err.status = e.response?.status;
  throw err;
});

export const api = {
  login: (body) => unwrap(http.post("/auth/login", body)),
  register: (body) => unwrap(http.post("/auth/register", body)),
  logout: () => unwrap(http.post("/auth/logout")),
  me: () => unwrap(http.get("/auth/me")),
  refresh: () => unwrap(http.post("/auth/refresh")),
  meta: () => unwrap(http.get("/meta")),
  createComplaint: (body) => unwrap(http.post("/complaints", body)),
  myComplaints: () => unwrap(http.get("/complaints/mine")),
  listComplaints: (params) => unwrap(http.get("/complaints", { params })),
  getComplaint: (id) => unwrap(http.get(`/complaints/${id}`)),
  triage: (body) => unwrap(http.post("/triage", body)),
  route: (body) => unwrap(http.post("/route", body)),
  escalate: (ticketId, reason) => unwrap(http.post("/escalate", { ticketId, reason })),
  setStatus: (id, status, note) => unwrap(http.post(`/complaints/${id}/status`, { status, note })),
  override: (id, body) => unwrap(http.post(`/complaints/${id}/override`, body)),
  feedback: (id, resolved) => unwrap(http.post(`/complaints/${id}/feedback`, { resolved })),
  simulateBreach: (id) => unwrap(http.post(`/complaints/${id}/simulate-breach`)),
  dashboard: () => unwrap(http.get("/dashboard")),
  hotspots: () => unwrap(http.get("/hotspots")),
  duplicates: (ticketId) => unwrap(http.get("/duplicates", { params: { ticketId } })),
};
