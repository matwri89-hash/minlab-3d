"use client";

import { useMemo, useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Package,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStorage } from "@/lib/storage";
import { useAuth } from "./auth-provider";

function getDaysInMonth(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

function formatCurrency(value: number): string {
  return `${value.toFixed(2)} BYN`;
}

export function Dashboard() {
  const { user } = useAuth();

  const [todayDay, setTodayDay] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTodayDay(new Date().getDate());
  }, []);

  const data = useMemo(() => {
    const storage = getStorage();
    if (!storage || !user) {
      return {
        totalRevenue: 0,
        netProfit: 0,
        activeOrders: 0,
        criticalSpools: [],
        dailyIncome: [] as { day: number; amount: number }[],
        maxDailyIncome: 0,
      };
    }

    const userData = storage.userData[user.id];
    if (!userData) {
      return {
        totalRevenue: 0,
        netProfit: 0,
        activeOrders: 0,
        criticalSpools: [],
        dailyIncome: [] as { day: number; amount: number }[],
        maxDailyIncome: 0,
      };
    }

    const { orders, spools } = userData;

    const completedOrders = orders.filter((o) => o.status === "Выдан");
    const totalRevenue = completedOrders.reduce(
      (sum, o) => sum + o.finalPrice,
      0
    );
    const netProfit = completedOrders.reduce(
      (sum, o) => sum + (o.finalPrice - o.totalCost),
      0
    );
    const activeOrders = orders.filter((o) => o.status === "Принят").length;

    const criticalSpools = spools
      .filter((s) => s.currentWeight < 150)
      .sort((a, b) => a.currentWeight - b.currentWeight);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = getDaysInMonth();

    const dailyMap = new Map<number, number>();
    for (let d = 1; d <= daysInMonth; d++) {
      dailyMap.set(d, 0);
    }

    for (const order of completedOrders) {
      const d = new Date(order.createdAt);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        const day = d.getDate();
        dailyMap.set(day, (dailyMap.get(day) || 0) + order.finalPrice);
      }
    }

    const dailyIncome = Array.from(dailyMap.entries())
      .map(([day, amount]) => ({ day, amount }))
      .sort((a, b) => a.day - b.day);

    const maxDailyIncome = Math.max(...dailyIncome.map((d) => d.amount), 1);

    return {
      totalRevenue,
      netProfit,
      activeOrders,
      criticalSpools,
      dailyIncome,
      maxDailyIncome,
    };
  }, [user]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Дашборд</h2>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Общая выручка
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              По всем выполненным заказам
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Чистая прибыль
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Выручка минус себестоимость
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Активные заказы
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeOrders}</div>
            <p className="text-xs text-muted-foreground">
              Заказы в статусе &laquo;Принят&raquo;
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Stock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Критические остатки (&lt; 150 г)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.criticalSpools.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Критических остатков нет
            </p>
          ) : (
            <div className="space-y-2">
              {data.criticalSpools.map((spool) => (
                <div
                  key={spool.id}
                  className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-destructive" />
                    <span className="font-medium">
                      {spool.manufacturer} {spool.color}
                    </span>
                    <span className="text-muted-foreground">
                      ({spool.type})
                    </span>
                  </div>
                  <Badge
                    variant="destructive"
                    className="font-mono text-xs font-bold"
                  >
                    {spool.currentWeight} г
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Income Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Доходы за текущий месяц
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.dailyIncome.length === 0 || data.maxDailyIncome === 0 ? (
            <p className="text-sm text-muted-foreground">
              Нет данных о доходах за этот месяц
            </p>
          ) : (
            <div className="flex items-end gap-[3px] h-40">
              {data.dailyIncome.map((item) => {
                const heightPercent = (item.amount / data.maxDailyIncome) * 100;
                const isToday = item.day === todayDay;
                return (
                  <div
                    key={item.day}
                    className="group relative flex flex-1 flex-col items-center justify-end h-full"
                  >
                    <div
                      className={`
                        w-full rounded-t-sm transition-all duration-200
                        ${isToday ? "bg-primary" : "bg-primary/40"}
                        ${item.amount > 0 ? "min-h-[4px]" : ""}
                        group-hover:bg-primary/70
                      `}
                      style={{ height: `${Math.max(heightPercent, 0)}%` }}
                    />
                    <span className="mt-1 text-[10px] text-muted-foreground">
                      {item.day}
                    </span>
                    {item.amount > 0 && (
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 mb-1 hidden rounded bg-popover px-1.5 py-0.5 text-[10px] font-medium text-popover-foreground shadow-sm group-hover:block whitespace-nowrap">
                        {formatCurrency(item.amount)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
