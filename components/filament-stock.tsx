"use client";

import { useState, useCallback } from "react";
import { Trash2, AlertTriangle, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStorage, saveStorage, type FilamentSpool } from "@/lib/storage";
import { useAuth } from "./auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from "@/components/ui/progress";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const SPOOL_TYPES = [
  "PLA",
  "PETG",
  "ABS",
  "TPU",
  "ASA",
  "PC",
  "Nylon",
  "Другой",
];

const PRESET_COLORS = [
  "#000000",
  "#333333",
  "#666666",
  "#999999",
  "#BBBBBB",
  "#DDDDDD",
  "#FFFFFF",
  "#FF0000",
  "#CC0000",
  "#FF4444",
  "#FF6600",
  "#FF8800",
  "#FFCC00",
  "#FFFF00",
  "#88CC00",
  "#00AA00",
  "#006600",
  "#00AAAA",
  "#0088FF",
  "#0044FF",
  "#000088",
  "#8800AA",
  "#CC00FF",
  "#FF0088",
  "#FFCCAA",
  "#886644",
  "#D2B48C",
  "#C0C0C0",
  "#FFD700",
];

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    };
  }
  return { r: 128, g: 128, b: 128 };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function AddSpoolDialog({
  userId,
  onAdd,
}: {
  userId: string;
  onAdd: (spool: FilamentSpool) => void;
}) {
  const [open, setOpen] = useState(false);
  const [manufacturer, setManufacturer] = useState("");
  const [type, setType] = useState("PLA");
  const [r, setR] = useState(128);
  const [g, setG] = useState(128);
  const [b, setB] = useState(128);
  const [initialWeight, setInitialWeight] = useState("1000");
  const [price, setPrice] = useState("");

  const color = rgbToHex(r, g, b);

  const handlePresetClick = (hex: string) => {
    const { r: nr, g: ng, b: nb } = hexToRgb(hex);
    setR(nr);
    setG(ng);
    setB(nb);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manufacturer.trim() || !initialWeight || !price) {
      toast.error("Заполните все поля");
      return;
    }
    const weight = Number(initialWeight);
    if (weight <= 0) {
      toast.error("Вес должен быть больше 0");
      return;
    }
    const cost = Number(price);
    if (cost <= 0) {
      toast.error("Цена должна быть больше 0");
      return;
    }

    const spool: FilamentSpool = {
      id: crypto.randomUUID(),
      userId,
      manufacturer: manufacturer.trim(),
      type,
      color,
      initialWeight: weight,
      currentWeight: weight,
      price: cost,
      createdAt: new Date().toISOString(),
    };

    onAdd(spool);
    setOpen(false);
    setManufacturer("");
    setType("PLA");
    setR(128);
    setG(128);
    setB(128);
    setInitialWeight("1000");
    setPrice("");
    toast.success("Катушка добавлена");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Добавить катушку</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая катушка</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Производитель</label>
            <input
              className="flex h-9 w-full rounded-lg border bg-background px-3 py-1 text-sm shadow-sm"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              placeholder="eSun, Polymaker, SUNLU…"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Тип пластика</label>
            <select
              className="flex h-9 w-full rounded-lg border bg-background px-3 py-1 text-sm shadow-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {SPOOL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium">Цвет</label>
            <div className="flex items-center gap-3">
              <div
                className="size-10 shrink-0 rounded-lg border shadow-sm"
                style={{ backgroundColor: color }}
              />
              <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
                {color}
              </code>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="w-4 text-xs font-bold text-red-500">R</span>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={r}
                  onChange={(e) => setR(Number(e.target.value))}
                  className="flex-1 accent-red-500"
                />
                <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
                  {r}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-4 text-xs font-bold text-green-500">G</span>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={g}
                  onChange={(e) => setG(Number(e.target.value))}
                  className="flex-1 accent-green-500"
                />
                <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
                  {g}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-4 text-xs font-bold text-blue-500">B</span>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={b}
                  onChange={(e) => setB(Number(e.target.value))}
                  className="flex-1 accent-blue-500"
                />
                <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
                  {b}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`size-6 rounded-full border transition-all hover:scale-110 ${
                    color === c
                      ? "border-foreground ring-1 ring-foreground"
                      : "border-border"
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => handlePresetClick(c)}
                  aria-label={`Цвет ${c}`}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Начальный вес (г)</label>
            <select
              className="flex h-9 w-full rounded-lg border bg-background px-3 py-1 text-sm shadow-sm"
              value={initialWeight}
              onChange={(e) => setInitialWeight(e.target.value)}
            >
              <option value="1000">1000 г</option>
              <option value="2000">2000 г</option>
              <option value="3000">3000 г</option>
              <option value="5000">5000 г</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Цена</label>
            <input
              type="number"
              className="flex h-9 w-full rounded-lg border bg-background px-3 py-1 text-sm shadow-sm"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              min={0}
              step="0.01"
            />
          </div>
          <DialogFooter>
            <Button type="submit">Добавить</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SpoolCard({
  spool,
  onDelete,
}: {
  spool: FilamentSpool;
  onDelete: (id: string) => void;
}) {
  const ratio = spool.currentWeight / spool.initialWeight;
  const isLow = spool.currentWeight > 0 && spool.currentWeight < 150;
  const isDepleted = spool.currentWeight <= 0;

  return (
    <Card
      className={cn(
        "relative transition-all",
        isLow && "ring-yellow-500/50 bg-yellow-500/5",
        isDepleted && "opacity-60"
      )}
    >
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className="font-semibold leading-tight">
              {spool.manufacturer}
            </span>
            <span className="text-xs text-muted-foreground">{spool.type}</span>
          </div>
          <div
            className="flex size-5 shrink-0 items-center justify-center rounded"
            style={{ backgroundColor: spool.color }}
            title={spool.color}
          />
        </div>

        <div className="text-sm text-muted-foreground">{spool.color}</div>

        {isDepleted ? (
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Package className="size-4" />
            Закончился
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <Progress value={ratio * 100}>
              <ProgressTrack className="h-2">
                <ProgressIndicator
                  className={cn(isLow ? "bg-yellow-500" : "bg-primary")}
                />
              </ProgressTrack>
            </Progress>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>
                {spool.currentWeight} / {spool.initialWeight} г
              </span>
            </div>
          </div>
        )}

        {isLow && !isDepleted && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-yellow-600">
            <AlertTriangle className="size-3.5" />
            Менее 150 г — пополните запас
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{spool.price} р.</span>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          variant="ghost"
          size="icon-sm"
          className="ml-auto text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(spool.id)}
          aria-label="Удалить катушку"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export function FilamentStock() {
  const { user } = useAuth();
  const [, forceUpdate] = useState(0);

  const getSpools = useCallback((): FilamentSpool[] => {
    if (!user) return [];
    const data = getStorage();
    if (!data) return [];
    return data.userData[user.id]?.spools ?? [];
  }, [user]);

  const saveSpools = useCallback(
    (spools: FilamentSpool[]) => {
      if (!user) return;
      const data = getStorage();
      if (!data) return;
      if (!data.userData[user.id]) {
        data.userData[user.id] = {
          spools: [],
          orders: [],
          settings: {
            electricityRate: 0.3,
            amortizationRate: 0.5,
          },
        };
      }
      data.userData[user.id].spools = spools;
      saveStorage(data);
      forceUpdate((k) => k + 1);
    },
    [user]
  );

  const handleAdd = useCallback(
    (spool: FilamentSpool) => {
      const spools = getSpools();
      saveSpools([...spools, spool]);
    },
    [getSpools, saveSpools]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const spools = getSpools();
      saveSpools(spools.filter((s) => s.id !== id));
      toast.success("Катушка удалена");
    },
    [getSpools, saveSpools]
  );

  const spools = getSpools();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Склад пластика</h2>
        <AddSpoolDialog userId={user?.id ?? ""} onAdd={handleAdd} />
      </div>

      {spools.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Package className="size-12" />
          <p className="text-sm">Нет катушек. Добавьте первую!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {spools.map((spool) => (
            <SpoolCard key={spool.id} spool={spool} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
