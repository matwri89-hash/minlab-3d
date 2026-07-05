# Деплой MINLAB 3D

## Production-сборка

```bash
npm run build
```

Результат сохраняется в папку `.next` и готов к запуску через `npm start` (порт 3000).

## Варианты хостинга

### 1. Vercel (рекомендуется)

Приложение — стандартный Next.js, Vercel поддерживает его из коробки.

1. Создайте аккаунт на [vercel.com](https://vercel.com)
2. Установите Vercel CLI: `npm i -g vercel`
3. В корне проекта выполните:
   ```bash
   vercel --prod
   ```
4. Или подключите GitHub-репозиторий через дашборд Vercel

Vercel автоматически определит Next.js и запустит сборку. API-роут `/api/health` будет работать как serverless-функция.

### 2. Netlify

Netlify поддерживает Next.js через адаптер `@netlify/plugin-nextjs`.

1. Создайте аккаунт на [netlify.com](https://netlify.com)
2. Подключите GitHub-репозиторий
3. Настройки сборки:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
4. Netlify автоматически установит плагин Next.js

### 3. GitHub Pages (статический экспорт)

Если API-роут `/api/health` не нужен, можно собрать статический экспорт.

1. Установите `next export` совместимую версию (Next.js 16 поддерживает `output: 'export'`)

2. Соберите статику:

   ```bash
   OUTPUT_MODE=export npm run build
   ```

3. Включите GitHub Pages в настройках репозитория → **Source**: ветка `gh-pages` / папка `/docs`

4. Либо настройте GitHub Actions для автоматического деплоя.

**Важно**: при статическом экспорте Next.js API-роуты не работают. `/api/health` будет исключён из сборки.
