# UZEED Monorepo

UZEED es una plataforma premium para conectar clientes con profesionales y establecimientos. Este repositorio está preparado para deploy inmediato en Coolify.

## Stack
- **Web:** Next.js 14 (App Router) + Tailwind + shadcn/ui + Framer Motion
- **API:** Express + Socket.IO
- **DB:** Postgres + Prisma
- **Pagos:** Khipu PAC v1.0

## Requisitos
- Node.js 20+
- pnpm
- Postgres

## Variables de entorno
Copia `.env.example` y completa los valores:

```bash
cp .env.example .env
```

> **Assets:** El logo oficial y las imágenes de fondo deben reemplazar los placeholders ubicados en `apps/web/public/logo-placeholder.svg` y `apps/web/public/hero-placeholder.svg`.

## Scripts

```bash
pnpm install
pnpm --filter @uzeed/prisma migrate:deploy
pnpm --filter @uzeed/prisma seed
pnpm dev
```

## Deploy en Coolify
1. **Servicios:**
   - Database (Postgres)
   - API (apps/api) puerto `3001`
   - Web (apps/web) puerto `3000`
2. **Orden recomendado:** Database → API → Web
3. Variables `.env` configuradas en cada servicio.
4. Ejecutar `pnpm --filter @uzeed/prisma migrate:deploy` en la API como comando de prestart.

## Puertos
- Web: `3000`
- API: `3001`

## Socket.IO
El frontend se conecta vía `NEXT_PUBLIC_API_URL` con `?userId=` para presencia y chat.

