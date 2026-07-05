"use client";

import { useState } from "react";
import {
  getStorage,
  saveStorage,
  type Settings as SettingsType,
  DEFAULT_SETTINGS,
} from "@/lib/storage";
import { useAuth } from "./auth-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function SettingsModal({
  open,
  onOpenChange,
  onSaved,
}: SettingsModalProps) {
  const { user } = useAuth();

  const currentSettings: SettingsType = (() => {
    if (!user) return DEFAULT_SETTINGS;
    const data = getStorage();
    if (!data) return DEFAULT_SETTINGS;
    return data.userData[user.id]?.settings ?? DEFAULT_SETTINGS;
  })();

  const [electricityRate, setElectricityRate] = useState(
    String(currentSettings.electricityRate)
  );
  const [amortizationRate, setAmortizationRate] = useState(
    String(currentSettings.amortizationRate)
  );

  const handleSave = () => {
    if (!user) return;

    const data = getStorage();
    if (!data) return;

    if (!data.userData[user.id]) {
      data.userData[user.id] = {
        spools: [],
        orders: [],
        settings: DEFAULT_SETTINGS,
      };
    }

    data.userData[user.id].settings = {
      electricityRate: Number(electricityRate) || 0,
      amortizationRate: Number(amortizationRate) || 0,
    };

    saveStorage(data);
    onOpenChange(false);
    onSaved?.();
    toast.success("Настройки сохранены");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Настройки</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">
              Тариф электроэнергии (за час)
            </label>
            <input
              type="number"
              className="flex h-9 w-full rounded-lg border bg-background px-3 py-1 text-sm shadow-sm"
              value={electricityRate}
              onChange={(e) => setElectricityRate(e.target.value)}
              min={0}
              step="0.01"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">
              Амортизация оборудования (за час)
            </label>
            <input
              type="number"
              className="flex h-9 w-full rounded-lg border bg-background px-3 py-1 text-sm shadow-sm"
              value={amortizationRate}
              onChange={(e) => setAmortizationRate(e.target.value)}
              min={0}
              step="0.01"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
