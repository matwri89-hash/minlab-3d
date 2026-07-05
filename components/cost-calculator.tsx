"use client";

import { useState, useMemo, useCallback } from "react";
import { Calculator, Check, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getStorage,
  saveStorage,
  type FilamentSpool,
  type Order,
  type Settings,
  DEFAULT_SETTINGS,
} from "@/lib/storage";
import { useAuth } from "./auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { toast } from "sonner";

function formatCurrency(value: number): string {
  return `${value.toFixed(2)} Br`;
}

interface CostCalculatorProps {
  onOrderCreated?: () => void;
  settingsVersion?: number;
}

export function CostCalculator({
  onOrderCreated,
  settingsVersion,
}: CostCalculatorProps) {
  const { user } = useAuth();

  const [productName, setProductName] = useState("");
  const [clientName, setClientName] = useState("");
  const [weight, setWeight] = useState("");
  const [printTime, setPrintTime] = useState("");
  const [selectedSpoolId, setSelectedSpoolId] = useState("");
  const [postProcessing, setPostProcessing] = useState(false);
  const [postProcessingCost, setPostProcessingCost] = useState("");
  const [finalPrice, setFinalPrice] = useState("");

  const weightNum = Number(weight) || 0;
  const printTimeNum = Number(printTime) || 0;
  const postProcessingCostNum = Number(postProcessingCost) || 0;

  const userSettings: Settings = useMemo(() => {
    if (!user) return DEFAULT_SETTINGS;
    const data = getStorage();
    if (!data) return DEFAULT_SETTINGS;
    return data.userData[user.id]?.settings ?? DEFAULT_SETTINGS;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, settingsVersion]);

  const spools: FilamentSpool[] = useMemo(() => {
    if (!user) return [];
    const data = getStorage();
    if (!data) return [];
    return (
      data.userData[user.id]?.spools?.filter((s) => s.currentWeight > 0) ?? []
    );
  }, [user]);

  const selectedSpool = useMemo(
    () => spools.find((s) => s.id === selectedSpoolId) ?? null,
    [spools, selectedSpoolId]
  );

  const plasticCost = useMemo(() => {
    if (!selectedSpool || weightNum <= 0) return 0;
    return (weightNum / selectedSpool.initialWeight) * selectedSpool.price;
  }, [selectedSpool, weightNum]);

  const laborCost = useMemo(() => {
    if (printTimeNum <= 0) return 0;
    return (
      printTimeNum * userSettings.electricityRate +
      printTimeNum * userSettings.amortizationRate
    );
  }, [printTimeNum, userSettings]);

  const actualPostCost = postProcessing ? postProcessingCostNum : 0;

  const totalCost = useMemo(
    () => plasticCost + laborCost + actualPostCost,
    [plasticCost, laborCost, actualPostCost]
  );

  const finalPriceNum = Number(finalPrice) || 0;

  const profit = useMemo(
    () => finalPriceNum - totalCost,
    [finalPriceNum, totalCost]
  );

  const margin = useMemo(() => {
    if (finalPriceNum <= 0) return 0;
    return (profit / finalPriceNum) * 100;
  }, [profit, finalPriceNum]);

  const handleFinalPriceChange = useCallback((value: string) => {
    setFinalPrice(value);
  }, []);

  const isWeightExceedsSpool = useMemo(() => {
    if (!selectedSpool || weightNum <= 0) return false;
    return weightNum > selectedSpool.currentWeight;
  }, [selectedSpool, weightNum]);

  const canCreateOrder =
    productName.trim() &&
    weightNum > 0 &&
    printTimeNum > 0 &&
    selectedSpoolId &&
    finalPriceNum >= totalCost &&
    !isWeightExceedsSpool;

  const handleCreateOrder = useCallback(() => {
    if (!user || !canCreateOrder) return;

    const data = getStorage();
    if (!data) return;

    if (!data.userData[user.id]) {
      toast.error("Ошибка загрузки данных");
      return;
    }

    const order: Order = {
      id: crypto.randomUUID(),
      userId: user.id,
      clientName: clientName.trim(),
      productName: productName.trim(),
      filamentSpoolId: selectedSpoolId,
      weight: weightNum,
      printTime: printTimeNum,
      postProcessing,
      postProcessingCost: actualPostCost,
      plasticCost,
      laborCost,
      totalCost,
      finalPrice: finalPriceNum,
      status: "Принят",
      createdAt: new Date().toISOString(),
    };

    data.userData[user.id].orders.push(order);
    saveStorage(data);

    setProductName("");
    setClientName("");
    setWeight("");
    setPrintTime("");
    setSelectedSpoolId("");
    setPostProcessing(false);
    setPostProcessingCost("");
    setFinalPrice("");

    toast.success(`Заказ «${order.productName}» создан`);
    onOrderCreated?.();
  }, [
    user,
    canCreateOrder,
    clientName,
    productName,
    selectedSpoolId,
    weightNum,
    printTimeNum,
    postProcessing,
    actualPostCost,
    plasticCost,
    laborCost,
    totalCost,
    finalPriceNum,
    onOrderCreated,
  ]);

  const allFieldsFilled =
    productName.trim() && weightNum > 0 && printTimeNum > 0 && selectedSpoolId;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Calculator className="size-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Калькулятор себестоимости
          </h2>
          <p className="text-sm text-muted-foreground">
            Рассчитайте стоимость заказа и оформите его
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <Card>
          <CardContent className="flex flex-col gap-5 pt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Параметры заказа
            </h3>

            <div className="flex flex-col gap-2">
              <Label>Изделие</Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Название изделия"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Клиент</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Имя клиента"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Масса изделия (г)</Label>
              <Input
                type="number"
                min={0}
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0.0"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Время печати (ч)</Label>
              <Input
                type="number"
                min={0}
                step="0.1"
                value={printTime}
                onChange={(e) => setPrintTime(e.target.value)}
                placeholder="0.0"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Катушка</Label>
              {spools.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  <Package className="size-4 shrink-0" />
                  Нет доступных катушек. Добавьте на склад.
                </div>
              ) : (
                <Select
                  value={selectedSpoolId}
                  onValueChange={(value) => {
                    if (value !== null) setSelectedSpoolId(value);
                  }}
                >
                  <SelectTrigger className="w-full min-h-10">
                    {selectedSpool ? (
                      <span
                        data-slot="select-value"
                        className="flex flex-1 items-center gap-1.5 text-left"
                      >
                        <div
                          className="size-3.5 shrink-0 rounded"
                          style={{ backgroundColor: selectedSpool.color }}
                        />
                        <span className="truncate">
                          {selectedSpool.manufacturer} {selectedSpool.type} (
                          {selectedSpool.currentWeight}г)
                        </span>
                      </span>
                    ) : (
                      <span
                        data-slot="select-value"
                        className="flex flex-1 items-center gap-1.5 text-left text-muted-foreground"
                      >
                        — Выберите катушку —
                      </span>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {spools.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <div
                          className="size-3.5 shrink-0 rounded"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.manufacturer} {s.type} ({s.currentWeight}г)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="postProcessing"
                  className="size-4 rounded border-input accent-primary"
                  checked={postProcessing}
                  onChange={(e) => setPostProcessing(e.target.checked)}
                />
                <Label htmlFor="postProcessing" className="cursor-pointer">
                  Постобработка
                </Label>
              </div>

              {postProcessing && (
                <div className="flex flex-col gap-2 pl-7">
                  <Label>Стоимость постобработки</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={postProcessingCost}
                    onChange={(e) => setPostProcessingCost(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardContent className="flex flex-col gap-5 pt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Результаты расчёта
            </h3>

            {!allFieldsFilled ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                <Calculator className="size-12" />
                <p className="text-sm">
                  Заполните параметры заказа для расчёта
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">
                    Себестоимость пластика
                  </span>
                  <span className="font-medium">
                    {formatCurrency(plasticCost)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">
                    Стоимость работы
                  </span>
                  <span className="font-medium">
                    {formatCurrency(laborCost)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">
                    Стоимость постобработки
                  </span>
                  <span className="font-medium">
                    {formatCurrency(actualPostCost)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold">
                  <span>Общая себестоимость</span>
                  <span>{formatCurrency(totalCost)}</span>
                </div>

                <Separator />

                <div className="flex flex-col gap-2">
                  <Label>Окончательная стоимость</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={finalPrice}
                    onChange={(e) => handleFinalPriceChange(e.target.value)}
                    placeholder={totalCost.toFixed(2)}
                  />
                  {finalPriceNum > 0 && finalPriceNum < totalCost && (
                    <p className="text-xs text-destructive">
                      Не может быть меньше общей себестоимости (
                      {formatCurrency(totalCost)})
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Чистая прибыль</span>
                  <span
                    className={cn(
                      "font-medium",
                      profit >= 0 ? "text-emerald-500" : "text-destructive"
                    )}
                  >
                    {formatCurrency(profit)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Маржинальность</span>
                  <span
                    className={cn(
                      "font-medium",
                      margin >= 20
                        ? "text-emerald-500"
                        : margin >= 0
                          ? "text-yellow-500"
                          : "text-destructive"
                    )}
                  >
                    {margin.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create order button */}
      {isWeightExceedsSpool && selectedSpool && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          <span className="mt-0.5 shrink-0">⚠</span>
          <span>
            Масса изделия ({weightNum}&nbsp;г) превышает остаток выбранной
            катушки ({selectedSpool.currentWeight}&nbsp;г). Оформление заказа
            недоступно.
          </span>
        </div>
      )}
      <div className="flex justify-end">
        <Button
          size="lg"
          className="gap-2"
          disabled={!canCreateOrder}
          onClick={handleCreateOrder}
        >
          <Check className="size-4" />
          Оформить как заказ
        </Button>
      </div>
    </div>
  );
}
