# 好大一颗菜部署说明

## 当前部署形态

- `apps/admin-web`：Vite 静态站点，建议独立静态部署
- `apps/user-web`：Vite 静态站点，建议独立静态部署
- `apps/api`：NestJS Node 服务，建议容器化部署或平台托管部署
- 数据库：外部 PostgreSQL
- 对象存储：当前仅保留占位建议，不在本阶段实现上传链路

## 推荐正式域名

- 用户端：`https://app.example.com`
- 管理端：`https://admin.example.com`
- API：`https://api.example.com`

说明：

- 用户端和管理端建议拆分独立二级域名，避免 Cookie、CORS 和部署回滚互相影响
- API 建议独立域名，便于前后端环境变量切换和后续网关/CDN 接入

## 环境变量

### `apps/admin-web`

文件模板：

- `apps/admin-web/.env.example`
- `apps/admin-web/.env.development`
- `apps/admin-web/.env.production`

变量说明：

- `VITE_API_BASE_URL`：管理端请求的 API 根地址，例如 `https://api.example.com/api`
- `VITE_APP_BASE_PATH`：管理端部署子路径，默认 `/`
- `VITE_DEV_PORT`：本地开发端口，默认 `5175`

### `apps/user-web`

文件模板：

- `apps/user-web/.env.example`
- `apps/user-web/.env.development`
- `apps/user-web/.env.production`

变量说明：

- `VITE_API_BASE_URL`：用户端请求的 API 根地址，例如 `https://api.example.com/api`
- `VITE_APP_BASE_PATH`：用户端部署子路径，默认 `/`
- `VITE_DEV_PORT`：本地开发端口，默认 `5174`

### `apps/api`

文件模板：

- `apps/api/.env.example`
- `apps/api/.env.development`
- `apps/api/.env.production`

变量说明：

- `NODE_ENV`：运行环境，开发环境建议 `development`，线上使用 `production`
- `HOST`：监听地址，部署时保持 `0.0.0.0`
- `PORT`：服务端口，部署平台通常会自动注入
- `DATABASE_URL`：PostgreSQL 连接串，例如 `postgresql://user:pass@host:5432/db?schema=public`
- `JWT_SECRET`：access token 签名密钥
- `JWT_REFRESH_SECRET`：refresh token 签名密钥
- `JWT_ACCESS_TTL_SECONDS`：access token 过期秒数
- `JWT_REFRESH_TTL_SECONDS`：refresh token 过期秒数
- `CORS_ALLOW_ORIGINS`：逗号分隔的允许来源列表
- `SEED_MODE`：seed 场景，开发/演示环境可使用 `development` 或 `demo`
- `ALLOW_PRODUCTION_SEED`：生产环境是否允许写入演示数据，默认 `false`

## 正式切域名时需要修改的环境变量

### `apps/admin-web`

- `VITE_API_BASE_URL`
- `VITE_APP_BASE_PATH`

### `apps/user-web`

- `VITE_API_BASE_URL`
- `VITE_APP_BASE_PATH`

### `apps/api`

- `CORS_ALLOW_ORIGINS`
- `PORT`：通常由平台注入，无需手工固定
- `HOST`：保持 `0.0.0.0`
- 若域名切换伴随环境切换，也需要确认 `NODE_ENV`

## CORS_ALLOW_ORIGINS 配置示例

开发环境：

```env
CORS_ALLOW_ORIGINS=http://localhost:5174,http://localhost:5175
```

生产环境：

```env
CORS_ALLOW_ORIGINS=https://app.example.com,https://admin.example.com
```

说明：

- 不要把生产环境配置成 `*`
- 如果后续增加预发环境，可在变量中继续追加独立域名
- 用户端和管理端域名都必须包含在 `CORS_ALLOW_ORIGINS` 中

## 域名绑定准备

### `admin-web` 域名绑定

推荐域名：

- `admin.example.com`

步骤：

1. 在静态托管平台创建管理端站点
2. 构建目录指向 `apps/admin-web`
3. 构建命令使用：

```bash
corepack pnpm install
corepack pnpm --filter @haodacai/admin-web build
```

4. 输出目录使用 `apps/admin-web/dist`
5. 在托管平台绑定自定义域名 `admin.example.com`
6. 将 `VITE_API_BASE_URL` 设置为正式 API 域名，例如 `https://api.example.com/api`
7. 若不是根路径部署，再配置 `VITE_APP_BASE_PATH`

### `user-web` 域名绑定

推荐域名：

- `app.example.com`

步骤：

1. 在静态托管平台创建用户端站点
2. 构建目录指向 `apps/user-web`
3. 构建命令使用：

```bash
corepack pnpm install
corepack pnpm --filter @haodacai/user-web build
```

4. 输出目录使用 `apps/user-web/dist`
5. 在托管平台绑定自定义域名 `app.example.com`
6. 将 `VITE_API_BASE_URL` 设置为正式 API 域名，例如 `https://api.example.com/api`
7. 若不是根路径部署，再配置 `VITE_APP_BASE_PATH`

### `api` 域名绑定

推荐域名：

- `api.example.com`

步骤：

1. 在 Node 托管平台或容器平台创建 API 服务
2. 注入 `DATABASE_URL`、`JWT_SECRET`、`JWT_REFRESH_SECRET`、`CORS_ALLOW_ORIGINS`
3. 首次启动前执行正式迁移
4. 服务启动后绑定 `api.example.com`
5. 确认 `/api/health` 可从公网访问

## DNS 配置占位说明

不同平台记录值不同，这里只给占位策略：

### `admin.example.com`

- 若使用 Vercel / Netlify 等静态平台：通常配置 `CNAME`
- 若平台要求 A 记录：使用平台提供的固定 IP 或入口地址

### `app.example.com`

- 静态平台一般同样使用 `CNAME`

### `api.example.com`

- 若使用 Render / Railway / Fly.io / 云主机负载均衡：一般使用 `CNAME`
- 若直接指向云服务器公网 IP：使用 `A` 记录

建议：

- 所有 DNS 记录的真实值以部署平台后台提供的数据为准
- 在正式切换前先把 TTL 调低，便于切换和回滚

## HTTPS / 证书注意事项

- 前端和 API 均建议全站 HTTPS
- 优先使用托管平台自动签发的证书
- 若使用自管负载均衡或网关，需要手工配置证书续期
- `VITE_API_BASE_URL` 必须与最终 HTTPS 域名一致，避免浏览器 mixed content
- JWT 密钥和数据库密码不要写进前端环境变量

## Prisma 迁移与 Seed

### 生产迁移命令

在 `apps/api` 下使用：

```bash
corepack pnpm prisma:generate
corepack pnpm prisma:migrate:deploy
```

说明：

- `prisma generate`：生成 Prisma Client，构建和启动前建议执行
- `prisma migrate deploy`：上线时执行正式迁移，生产环境必须依赖它

### Seed 命令

```bash
corepack pnpm prisma:seed
```

当前 seed 内容：

- 演示店铺、分类、商品
- 演示用户 `end_user_demo`
- 演示商家管理员 `merchant_admin_demo`
- 演示超级管理员 `super_admin_demo`

适用范围：

- 开发环境：可以执行
- 演示环境：可以执行
- 生产环境：默认禁止执行，除非显式设置 `ALLOW_PRODUCTION_SEED=true`

### 推荐使用策略

- 本地开发：先 `migrate deploy`，再 `db seed`
- 演示环境：允许 `db seed`
- 正式生产：默认不执行演示 seed，只导入真实基础数据

## 从零部署步骤

### 1. 准备 PostgreSQL

1. 创建 PostgreSQL 数据库
2. 获取 `DATABASE_URL`
3. 确保数据库允许 API 部署平台访问

### 2. 部署 API

可选方式一：Node 服务直接部署

1. 进入仓库根目录执行 `corepack pnpm install`
2. 执行 `corepack pnpm --filter @haodacai/shared build`
3. 执行 `corepack pnpm --filter @haodacai/api prisma:generate`
4. 执行 `corepack pnpm --filter @haodacai/api build`
5. 在线上环境注入 `apps/api/.env.production` 对应变量
6. 首次上线执行 `corepack pnpm --filter @haodacai/api prisma:migrate:deploy`
7. 启动 `corepack pnpm --filter @haodacai/api start:prod`

可选方式二：Docker / Render

1. 使用仓库根目录作为 Docker build context
2. 构建命令：

```bash
docker build -f apps/api/Dockerfile -t haodacai-api .
```

3. 运行时注入：
   `DATABASE_URL`、`JWT_SECRET`、`JWT_REFRESH_SECRET`、`CORS_ALLOW_ORIGINS`
4. 容器启动时会执行 `prisma migrate deploy`，再启动 `node dist/main.js`
5. 可直接参考根目录 `render.yaml`

### 3. 部署 `admin-web`

1. 配置 `apps/admin-web/.env.production`
2. 执行 `corepack pnpm --filter @haodacai/admin-web build`
3. 部署 `apps/admin-web/dist`
4. 如果使用 Vercel，可直接使用 `apps/admin-web/vercel.json`
5. 若部署在子路径，例如 `/admin/`，设置 `VITE_APP_BASE_PATH=/admin/`

### 4. 部署 `user-web`

1. 配置 `apps/user-web/.env.production`
2. 执行 `corepack pnpm --filter @haodacai/user-web build`
3. 部署 `apps/user-web/dist`
4. 如果使用 Vercel，可直接使用 `apps/user-web/vercel.json`
5. 若部署在子路径，例如 `/app/`，设置 `VITE_APP_BASE_PATH=/app/`

## 跨域与安全建议

- 前端不要硬编码任何密钥，前端只保存 API 地址
- `JWT_SECRET` 和 `JWT_REFRESH_SECRET` 必须分离，并使用随机高强度值
- `CORS_ALLOW_ORIGINS` 在生产环境只允许正式前端域名
- 默认演示账号和演示 seed 仅用于开发/演示环境
- 不要在仓库提交真实 `.env`
- token 失效后，前端会自动尝试 refresh；refresh 失败则清理状态并跳转登录
- 若后续接入对象存储，建议使用独立 Bucket 和服务端签名上传，不要把存储密钥暴露给前端

## 上线后验证清单

### API

- `GET /api/health` 可访问
- `GET /api/shops/active` 正常返回
- `POST /api/auth/login` 可返回 access/refresh token
- 未带 token 调用受保护接口会返回 `401`
- 普通用户调用管理写接口会返回 `403`

### `user-web`

- 首页可正常加载真实数据
- 未登录访问 `/cart` 会跳转 `/login`
- 未登录访问 `/orders` 会跳转 `/login`
- 登录后能恢复访问原目标页
- 刷新页面后登录态仍有效
- token 过期后会自动 refresh，refresh 失败会回到登录页

### `admin-web`

- 未登录访问 `/menus` 会跳转 `/login`
- 商家管理员和超级管理员可登录
- 登录后可访问商品写接口和订单管理接口
- 普通用户账号不能登录管理端

## 本地开发步骤

1. 安装依赖：

```bash
corepack pnpm install
```

2. 准备本地 PostgreSQL，并设置 `apps/api/.env`

3. 执行迁移：

```bash
corepack pnpm db:generate
corepack pnpm db:migrate:deploy
```

4. 写入开发 seed：

```bash
corepack pnpm db:seed
```

5. 启动三端：

```bash
corepack pnpm dev
```

## 演示环境启动步骤

1. 准备独立 PostgreSQL 数据库
2. 使用 `apps/api/.env.production` 作为模板，设置演示环境变量
3. 执行：

```bash
corepack pnpm install
corepack pnpm db:generate
corepack pnpm db:migrate:deploy
corepack pnpm db:seed
corepack pnpm build
```

4. 启动 API
5. 部署 `admin-web/dist` 和 `user-web/dist`
6. 验证演示账号：

- `end_user_demo / Demo123456`
- `merchant_admin_demo / Demo123456`
- `super_admin_demo / Demo123456`
