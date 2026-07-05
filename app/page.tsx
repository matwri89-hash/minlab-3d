"use client";

import { AuthProvider, useAuth } from "@/components/auth-provider";
import { AuthScreen } from "@/components/auth-screen";
import { AppShell } from "@/components/app-shell";

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <AuthScreen />;
  }

  return <AppShell />;
}

export default function HomePage() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
