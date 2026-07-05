"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { ClipboardList, Filter, Package, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStorage, saveStorage, type Order } from "@/lib/storage";
import { useAuth } from "./auth-provider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type OrderStatus = Order["status"];

const STATUS_ORDER: OrderStatus[] = ["Принят", "Готов", "Выдан"];

const STATUS_COLOR_CLASS: Record<OrderStatus, string> = {
  Принят: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  Готов: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  Выдан: "bg-muted text-muted-foreground border-border",
};

function StatusSelect({
  status,
  onChange,
}: {
  status: OrderStatus;
  onChange: (newStatus: OrderStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors hover:opacity-80",
          STATUS_COLOR_CLASS[status]
        )}
      >
        {status}
        <ChevronDown className="size-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-32 whitespace-nowrap rounded-lg border bg-popover p-0.5 shadow-md">
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center rounded-md px-2.5 py-1 text-left text-xs font-medium transition-colors hover:bg-accent",
                s === status && "bg-accent"
              )}
            >
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  STATUS_COLOR_CLASS[s]
                )}
              >
                {s}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function formatCurrency(value: number): string {
  return `${value.toFixed(2)} Br`;
}

export function OrderCrm() {
  const { user } = useAuth();
  const [, forceUpdate] = useState(0);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  const data = useMemo(() => {
    if (!user) return { orders: [], spools: [] };
    const storage = getStorage();
    if (!storage) return { orders: [], spools: [] };
    const userData = storage.userData[user.id];
    if (!userData) return { orders: [], spools: [] };
    return { orders: userData.orders, spools: userData.spools };
  }, [user]);

  const getSpoolLabel = useCallback(
    (spoolId: string | null): string => {
      if (!spoolId) return "—";
      const spool = data.spools.find((s) => s.id === spoolId);
      if (!spool) return "—";
      return `${spool.manufacturer} ${spool.type} (${spool.color})`;
    },
    [data.spools]
  );

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return data.orders;
    return data.orders.filter((o) => o.status === statusFilter);
  }, [data.orders, statusFilter]);

  const handleStatusChange = useCallback(
    (orderId: string, newStatus: OrderStatus) => {
      if (!user) return;
      const storage = getStorage();
      if (!storage) return;

      const userData = storage.userData[user.id];
      if (!userData) return;

      const orderIndex = userData.orders.findIndex((o) => o.id === orderId);
      if (orderIndex === -1) return;

      const order = userData.orders[orderIndex];

      // When changing to "Готов", deduct weight from spool
      if (newStatus === "Готов" && order.status !== "Готов") {
        if (order.filamentSpoolId) {
          const spoolIndex = userData.spools.findIndex(
            (s) => s.id === order.filamentSpoolId
          );
          if (spoolIndex !== -1) {
            const spool = userData.spools[spoolIndex];
            const newWeight = Math.max(0, spool.currentWeight - order.weight);
            userData.spools[spoolIndex] = {
              ...spool,
              currentWeight: newWeight,
            };
          }
        }
      }

      userData.orders[orderIndex] = { ...order, status: newStatus };
      saveStorage(storage);
      forceUpdate((k) => k + 1);
      toast.success(`Статус заказа изменён на «${newStatus}»`);
    },
    [user]
  );

  const filterButtons: { label: string; value: OrderStatus | "all" }[] = [
    { label: "Все", value: "all" },
    { label: "Принят", value: "Принят" },
    { label: "Готов", value: "Готов" },
    { label: "Выдан", value: "Выдан" },
  ];

  const orders = filteredOrders;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardList className="size-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            CRM и история заказов
          </h2>
          <p className="text-sm text-muted-foreground">
            Управляйте заказами и отслеживайте их статус
          </p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2">
        <Filter className="size-4 text-muted-foreground" />
        {filterButtons.map((btn) => (
          <Button
            key={btn.value}
            variant={statusFilter === btn.value ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(btn.value)}
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {/* Orders table */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Package className="size-12" />
          <p className="text-sm">
            {data.orders.length === 0
              ? "Нет заказов. Создайте через калькулятор."
              : "Нет заказов с таким статусом."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full table-fixed text-sm min-w-[640px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-[55px] px-1.5 py-2.5 text-left font-medium text-muted-foreground">
                  ID
                </th>
                <th className="w-[15%] px-1.5 py-2.5 text-left font-medium text-muted-foreground truncate">
                  Клиент
                </th>
                <th className="w-[25%] px-1.5 py-2.5 text-left font-medium text-muted-foreground truncate">
                  Изделие
                </th>
                <th className="w-[20%] px-1.5 py-2.5 text-left font-medium text-muted-foreground truncate">
                  Пластик
                </th>
                <th className="w-[80px] px-1.5 py-2.5 text-right font-medium text-muted-foreground">
                  Себестоимость
                </th>
                <th className="w-[75px] px-1.5 py-2.5 text-right font-medium text-muted-foreground">
                  Цена
                </th>
                <th className="w-[80px] px-1.5 py-2.5 text-center font-medium text-muted-foreground">
                  Статус
                </th>
                <th className="w-[70px] px-1.5 py-2.5 text-left font-medium text-muted-foreground">
                  Дата
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="w-[55px] min-w-0 px-1.5 py-2.5 font-mono text-xs text-muted-foreground truncate">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="w-[15%] min-w-0 px-1.5 py-2.5 truncate font-medium">
                    {order.clientName}
                  </td>
                  <td className="w-[25%] min-w-0 px-1.5 py-2.5 truncate">
                    {order.productName}
                  </td>
                  <td className="w-[20%] min-w-0 px-1.5 py-2.5 truncate text-xs text-muted-foreground">
                    {getSpoolLabel(order.filamentSpoolId)}
                  </td>
                  <td className="w-[80px] min-w-0 px-1.5 py-2.5 text-right tabular-nums truncate">
                    {formatCurrency(order.totalCost)}
                  </td>
                  <td className="w-[75px] min-w-0 px-1.5 py-2.5 text-right tabular-nums font-medium truncate">
                    {formatCurrency(order.finalPrice)}
                  </td>
                  <td className="w-[80px] min-w-0 px-1.5 py-2.5 text-center">
                    <StatusSelect
                      status={order.status}
                      onChange={(newStatus) =>
                        handleStatusChange(order.id, newStatus)
                      }
                    />
                  </td>
                  <td className="w-[70px] min-w-0 px-1.5 py-2.5 text-xs text-muted-foreground truncate">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
