// Мок-данные для статического режима (без БД)
// Используются когда USE_DATABASE=false или БД недоступна

import { Service } from "./models";
import type { Post } from "./storage";

export const mockServices: Service[] = [
  {
    id: "mock-service-1",
    name: "API Gateway",
    description: "Шлюз для микросервисной архитектуры",
    status: "active",
    url: "https://api.example.com",
    createdAt: new Date("2024-01-15").toISOString(),
    updatedAt: new Date("2024-01-15").toISOString(),
  },
  {
    id: "mock-service-2",
    name: "Auth Service",
    description: "Сервис аутентификации и авторизации",
    status: "active",
    url: "https://auth.example.com",
    createdAt: new Date("2024-02-01").toISOString(),
    updatedAt: new Date("2024-02-01").toISOString(),
  },
  {
    id: "mock-service-3",
    name: "ML Pipeline",
    description: "Пайплайн для обработки данных с AI",
    status: "deploying",
    url: undefined,
    createdAt: new Date("2024-03-10").toISOString(),
    updatedAt: new Date("2024-03-10").toISOString(),
  },
];

export const mockPosts: Post[] = [
  {
    id: "mock-post-1",
    userId: "mock-user-1",
    authorName: "Алексей",
    text: "Запустили печать новой партии ваз по заказу. PETG белый, 0.2mm слой — качество отличное!",
    fileUrl: null,
    fileName: null,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "mock-post-2",
    userId: "mock-user-2",
    authorName: "Мария",
    text: "Кто-нибудь пробовал печатать TPU на прямом экструдере? Делитесь настройками!",
    fileUrl: null,
    fileName: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "mock-post-3",
    userId: "mock-user-1",
    authorName: "Алексей",
    text: "Обновил прошивку на Klipper — скорость печати выросла на 30%. Рекомендую!",
    fileUrl: null,
    fileName: null,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];
