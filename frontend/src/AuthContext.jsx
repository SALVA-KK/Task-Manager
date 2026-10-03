import { createContext, useContext, useEffect, useState } from "react";
import { api, clearToken, getToken, setToken, setUnauthorizedHandler } from "./api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(!!getToken());

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearToken();
      setAuthed(false);
    });
  }, []);

  const finish = (res) => {
    setToken(res.token);
    setAuthed(true);
  };

  const value = {
    authed,
    login: async (email, password) => finish(await api.login(email, password)),
    signup: async (email, password) => finish(await api.signup(email, password)),
    logout: async () => {
      try {
        await api.logout();
      } catch {
        // clear the local token even if the server call fails
      }
      clearToken();
      setAuthed(false);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}