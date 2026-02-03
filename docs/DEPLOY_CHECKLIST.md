# Checklist de Deploy (UZEED)

## Variables de entorno (API)
- `APP_URL`
- `API_URL`
- `CORS_ORIGIN` (opcional si coincide con `APP_URL`)
- `DATABASE_URL`
- `SESSION_SECRET`
- `COOKIE_DOMAIN` (opcional, recomendado en prod)
- `KHIPU_API_KEY`
- `KHIPU_SUBSCRIPTION_NOTIFY_URL`
- `KHIPU_CHARGE_NOTIFY_URL`
- `KHIPU_RETURN_URL`
- `KHIPU_CANCEL_URL`
- `KHIPU_WEBHOOK_SECRET` (opcional)
- `MEMBERSHIP_DAYS`
- `MEMBERSHIP_PRICE_CLP`
- `SHOP_MONTHLY_PRICE_CLP`
- `UPLOAD_DIR` / `STORAGE_DIR` / `UPLOADS_DIR`
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` (si aplica)

## Variables de entorno (Web)
- `NEXT_PUBLIC_API_URL`

## Pasos de deploy
1. Ejecutar migraciones Prisma en el servicio de API:
   - `pnpm --filter @uzeed/prisma migrate:deploy`
2. Generar cliente Prisma:
   - `pnpm --filter @uzeed/prisma generate`
3. Ejecutar seed inicial:
   - `pnpm --filter @uzeed/prisma seed`
4. Iniciar servicios web + api con las variables configuradas.
5. Validar `/health` y `/ready` en la API.
