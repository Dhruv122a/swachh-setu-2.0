import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

// user: null = checking, false = signed out, object = signed in
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    api.me().then(setUser).catch(() => api.refresh().then(setUser).catch(() => setUser(false)));
  }, []);
  const login = async (body) => { const u = await api.login(body); setUser(u); return u; };
  const register = async (body) => { const u = await api.register(body); setUser(u); return u; };
  const logout = async () => { try { await api.logout(); } finally { setUser(false); } };
  return <AuthContext.Provider value={{ user, login, register, logout, isAdmin: user && user.role === "admin" }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
export const homeFor = (u) => (u && u.role === "admin" ? "/command" : "/my");
