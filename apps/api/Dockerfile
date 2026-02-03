FROM node:20-alpine AS base
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY prisma/package.json prisma/package.json
RUN corepack enable && pnpm install --frozen-lockfile

FROM base AS build
COPY apps/api apps/api
COPY prisma prisma
RUN pnpm --filter @uzeed/prisma generate
RUN pnpm --filter @uzeed/api build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/index.js"]
