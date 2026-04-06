# 项目交接说明

## 1. 项目结构

- `apps/admin-web`：管理端前端
- `apps/user-web`：用户端前端
- `apps/api`：后端 API
- `packages/shared`：共享类型、角色、状态常量
- `packages/ui`：样式 token

## 2. 各端作用

### `apps/user-web`

- 商品浏览
- 登录 / 注册
- 购物车
- 下单
- 模拟支付
- 我的订单

### `apps/admin-web`

- 管理员登录
- 商品管理
- 订单列表与状态流转

### `apps/api`

- 商品、分类、店铺接口
- 购物车接口
- 订单接口
- 鉴权接口
- 用户接口与角色校验

## 3. 环境变量说明

### 管理端

- `VITE_API_BASE_URL`
- `VITE_APP_BASE_PATH`
- `VITE_DEV_PORT`

### 用户端

- `VITE_API_BASE_URL`
- `VITE_APP_BASE_PATH`
- `VITE_DEV_PORT`

### API

- `NODE_ENV`
- `HOST`
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL_SECONDS`
- `JWT_REFRESH_TTL_SECONDS`
- `CORS_ALLOW_ORIGINS`
- `SEED_MODE`
- `ALLOW_PRODUCTION_SEED`

模板文件见：

- `apps/admin-web/.env.example`
- `apps/user-web/.env.example`
- `apps/api/.env.example`

## 4. 数据库迁移命令

```bash
corepack pnpm db:generate
corepack pnpm db:migrate:deploy
```

说明：

- 所有环境统一使用 Prisma migration
- 生产环境不要依赖运行时自动建表

## 5. Seed 命令

```bash
corepack pnpm db:seed
```

用途：

- 开发环境初始化
- 演示环境初始化

不建议：

- 正式生产默认不执行演示 seed

## 6. 本地启动命令

```bash
corepack pnpm install
corepack pnpm db:generate
corepack pnpm db:migrate:deploy
corepack pnpm db:seed
corepack pnpm dev
```

## 7. 构建与发布命令

```bash
corepack pnpm typecheck
corepack pnpm build
corepack pnpm deploy:check
corepack pnpm release:verify
```

演示环境常用：

```bash
corepack pnpm demo:prepare
```

## 8. 部署命令

### API

```bash
corepack pnpm --filter @haodacai/shared build
corepack pnpm --filter @haodacai/api prisma:generate
corepack pnpm --filter @haodacai/api prisma:migrate:deploy
corepack pnpm --filter @haodacai/api build
corepack pnpm --filter @haodacai/api start:prod
```

### 前端

```bash
corepack pnpm --filter @haodacai/admin-web build
corepack pnpm --filter @haodacai/user-web build
```

## 9. 常见维护入口

- 健康检查：`/api/health`
- 用户端登录页：`/login`
- 管理端登录页：`/login`
- 用户端订单：`/orders`
- 管理端订单：`/orders`
- 商品管理：`/menus`

## 10. 常见维护动作

- 重新生成 Prisma Client：`corepack pnpm db:generate`
- 执行数据库迁移：`corepack pnpm db:migrate:deploy`
- 重建演示数据：`corepack pnpm db:seed`
- 发布前验证：`corepack pnpm deploy:check`

## 11. 交接时必须口头确认的事项

- 演示账号仅限开发/演示环境
- 生产环境需要独立初始化正式管理员账号
- JWT 密钥必须在部署平台单独维护
- `CORS_ALLOW_ORIGINS` 必须与正式域名一致
- 若前端部署在子路径，必须同步修改 `VITE_APP_BASE_PATH`
