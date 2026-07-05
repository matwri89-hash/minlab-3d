export interface User {
  id: string;
  name: string;
  password: string;
  createdAt: string;
}

export interface FilamentSpool {
  id: string;
  userId: string;
  manufacturer: string;
  type: string;
  color: string;
  initialWeight: number;
  currentWeight: number;
  price: number;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  clientName: string;
  productName: string;
  filamentSpoolId: string | null;
  weight: number;
  printTime: number;
  postProcessing: boolean;
  postProcessingCost: number;
  plasticCost: number;
  laborCost: number;
  totalCost: number;
  finalPrice: number;
  status: "Принят" | "Готов" | "Выдан";
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  authorName: string;
  text: string;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface Settings {
  electricityRate: number;
  amortizationRate: number;
}

export interface UserData {
  spools: FilamentSpool[];
  orders: Order[];
  settings: Settings;
}

export interface AppData {
  users: User[];
  posts: Post[];
  comments: Comment[];
  userData: Record<string, UserData>;
}

const DEFAULT_SETTINGS: Settings = {
  electricityRate: 0.3,
  amortizationRate: 0.5,
};

const STORAGE_KEY = "printmanager_data";

export function initStorage(): AppData {
  if (typeof window === "undefined") {
    return createEmptyData();
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const data = JSON.parse(raw) as AppData;
      if (!data.comments) data.comments = [];
      return data;
    } catch {
      // corrupted data, reinitialize
    }
  }

  const data = createEmptyData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

export function saveStorage(data: AppData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getStorage(): AppData | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as AppData;
    if (!data.comments) data.comments = [];
    return data;
  } catch {
    return null;
  }
}

function createEmptyData(): AppData {
  return {
    users: [],
    posts: [],
    comments: [],
    userData: {},
  };
}

export { DEFAULT_SETTINGS, STORAGE_KEY };
