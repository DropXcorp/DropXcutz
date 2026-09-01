FROM oven/bun:1 AS base
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run prisma:generate && bun run typecheck
ENV NODE_ENV=production
EXPOSE 5000
CMD ["bun", "src/index.ts"]
