# Build
FROM node:20 AS build
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/ui/package.json packages/ui/
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate
RUN pnpm install --filter chatstack-web... --filter @chatstack/ui...
COPY . .
RUN pnpm -C packages/ui build
RUN pnpm -C apps/web build

# Run
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/web/.next .next
COPY apps/web/package.json package.json
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate && pnpm i --prod
EXPOSE 3000
CMD ["pnpm","start","-C","apps/web"]
