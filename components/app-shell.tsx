"use client";

import { useState, useRef } from "react";
import {
  LayoutDashboard,
  HardDrive,
  Calculator,
  ClipboardList,
  Rss,
  Settings,
  Menu,
  X,
  Warehouse,
  LogOut,
  User,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { initStorage } from "@/lib/storage";
import { useAuth } from "./auth-provider";
import { Button } from "@/components/ui/button";
import { FilamentStock } from "./filament-stock";
import { CostCalculator } from "./cost-calculator";
import { OrderCrm } from "./order-crm";
import { Dashboard } from "./dashboard";
import { Feed } from "./feed";
import { SettingsModal } from "./settings-modal";

type TabId = "dashboard" | "stock" | "calculator" | "crm" | "feed" | "settings";

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Дашборд", icon: LayoutDashboard },
  { id: "stock", label: "Склад", icon: Warehouse },
  { id: "calculator", label: "Калькулятор", icon: Calculator },
  { id: "crm", label: "Заказы", icon: ClipboardList },
  { id: "feed", label: "Лента", icon: Rss },
  { id: "settings", label: "Настройки", icon: Settings },
];

function DashboardTab() {
  return <Dashboard />;
}

function StockTab() {
  return <FilamentStock />;
}

function CalculatorTab({
  onOrderCreated,
  settingsVersion,
}: {
  onOrderCreated?: () => void;
  settingsVersion: number;
}) {
  return (
    <CostCalculator
      onOrderCreated={onOrderCreated}
      settingsVersion={settingsVersion}
    />
  );
}

function CrmTab() {
  return <OrderCrm />;
}

function FeedTab() {
  return <Feed />;
}

function SettingsTab() {
  return null;
}

function TabContent({
  tab,
  onCalculatorOrderCreated,
  settingsVersion,
}: {
  tab: TabId;
  onCalculatorOrderCreated?: () => void;
  settingsVersion: number;
}) {
  switch (tab) {
    case "dashboard":
      return <DashboardTab />;
    case "stock":
      return <StockTab />;
    case "calculator":
      return (
        <CalculatorTab
          onOrderCreated={onCalculatorOrderCreated}
          settingsVersion={settingsVersion}
        />
      );
    case "crm":
      return <CrmTab />;
    case "feed":
      return <FeedTab />;
    case "settings":
      return <SettingsTab />;
  }
}

export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsVersion, setSettingsVersion] = useState(0);
  const [logo, setLogo] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("app_logo");
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, logout } = useAuth();

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLogo(dataUrl);
      localStorage.setItem("app_logo", dataUrl);
    };
    reader.readAsDataURL(file);
  }

  initStorage();

  const currentTabIsSettings = activeTab === "settings";

  const handleNavClick = (id: TabId) => {
    if (id === "settings") {
      setSettingsOpen(true);
    } else {
      setActiveTab(id);
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Закрыть меню"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-sidebar transition-transform duration-200 md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-14 items-center border-b px-4">
          <button
            className="ml-auto md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Закрыть меню"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  handleNavClick(item.id);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  activeTab === item.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t p-3 space-y-2">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground">
            <User className="h-4 w-4 shrink-0" />
            <span className="truncate font-medium">{user?.name}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </Button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center gap-3 border-b bg-background/80 backdrop-blur-md px-4">
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Открыть меню"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden">
              {logo ? (
                <img
                  src={logo}
                  alt="Logo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <HardDrive className="h-4 w-4" />
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                aria-label="Загрузить логотип"
              >
                <Camera className="h-3 w-3 text-white" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
            <span className="font-semibold tracking-tight">MINLAB 3D</span>
          </div>
          <div className="ml-auto text-sm text-muted-foreground">
            {NAV_ITEMS.find((i) => i.id === activeTab)?.label}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <TabContent
            tab={activeTab}
            settingsVersion={settingsVersion}
            onCalculatorOrderCreated={() => setActiveTab("crm")}
          />

          <SettingsModal
            open={settingsOpen}
            onOpenChange={(open) => {
              setSettingsOpen(open);
              if (!open && currentTabIsSettings) {
                setActiveTab("dashboard");
              }
            }}
            onSaved={() => setSettingsVersion((v) => v + 1)}
          />
        </main>
      </div>
    </div>
  );
}
