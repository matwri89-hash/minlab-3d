"use client";

import { useState } from "react";
import { useAuth } from "./auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, Lock, LogIn, UserPlus } from "lucide-react";

export function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Введите имя");
      return;
    }
    if (!password) {
      setError("Введите пароль");
      return;
    }
    if (mode === "register") {
      if (password.length < 3) {
        setError("Пароль должен быть не менее 3 символов");
        return;
      }
      if (password !== confirmPassword) {
        setError("Пароли не совпадают");
        return;
      }
      const result = register(trimmedName, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
    } else {
      const result = login(trimmedName, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
    }
  }

  function switchMode() {
    setMode(mode === "login" ? "register" : "login");
    setError(null);
    setConfirmPassword("");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-industrial p-4">
      <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg overflow-hidden">
            <img
              src="/icon.png"
              alt="MINLAB 3D"
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">MINLAB 3D</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login"
              ? "Войдите в свой аккаунт"
              : "Создайте новый аккаунт"}
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>{mode === "login" ? "Вход" : "Регистрация"}</CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Используйте имя пользователя и пароль"
                : "Придумайте имя и пароль для входа"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Имя пользователя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                  />
                </div>
              </div>

              {mode === "register" && (
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      type="password"
                      placeholder="Подтвердите пароль"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full gap-2">
                {mode === "login" ? (
                  <>
                    <LogIn className="h-4 w-4" />
                    Войти
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Зарегистрироваться
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  Нет аккаунта?{" "}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-primary hover:underline"
                  >
                    Зарегистрироваться
                  </button>
                </>
              ) : (
                <>
                  Уже есть аккаунт?{" "}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-primary hover:underline"
                  >
                    Войти
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
