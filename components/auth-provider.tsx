"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { initStorage, saveStorage, type User } from "@/lib/storage";

interface AuthContextValue {
  user: User | null;
  login: (
    name: string,
    password: string
  ) => { ok: true } | { ok: false; error: string };
  register: (
    name: string,
    password: string
  ) => { ok: true } | { ok: false; error: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("printmanager_session");
    if (!raw) return;
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(JSON.parse(raw) as User);
    } catch {
      sessionStorage.removeItem("printmanager_session");
    }
  }, []);

  const login = useCallback((name: string, password: string) => {
    const data = initStorage();
    if (!data) return { ok: false, error: "Ошибка хранилища" };

    const found = data.users.find((u) => u.name === name);
    if (!found) return { ok: false, error: "Пользователь не найден" };
    if (found.password !== password)
      return { ok: false, error: "Неверный пароль" };

    setUser(found);
    sessionStorage.setItem("printmanager_session", JSON.stringify(found));
    return { ok: true as const };
  }, []);

  const register = useCallback((name: string, password: string) => {
    const data = initStorage();
    if (!data) return { ok: false, error: "Ошибка хранилища" };

    if (data.users.some((u) => u.name === name)) {
      return { ok: false, error: "Пользователь с таким именем уже существует" };
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      password,
      createdAt: new Date().toISOString(),
    };

    data.users.push(newUser);
    data.userData[newUser.id] = {
      spools: [],
      orders: [],
      settings: {
        electricityRate: 0.3,
        amortizationRate: 0.5,
      },
    };
    saveStorage(data);

    setUser(newUser);
    sessionStorage.setItem("printmanager_session", JSON.stringify(newUser));
    return { ok: true as const };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem("printmanager_session");
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
