FROM node:20-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @haodacai/shared build
RUN pnpm --filter @haodacai/api prisma:generate
RUN pnpm --filter @haodacai/api build

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "dist/main.js"]
