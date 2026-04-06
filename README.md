# 好大一颗菜

一个基于 `pnpm workspace` 的全栈 monorepo，包含：

- `apps/admin-web`：管理端，负责商品管理和订单管理
- `apps/user-web`：用户端，负责浏览、购物车、下单、模拟支付和订单查看
- `apps/api`：NestJS API，提供商品、购物车、订单、鉴权和用户接口
- `packages/shared`：共享类型、角色、状态枚举
- `packages/ui`：基础样式 token

## 快速启动

### 1. 安装依赖

```bash
corepack pnpm install
```

### 2. 准备 API 环境变量

参考：

- `apps/api/.env.example`
- `apps/api/.env.development`

本地开发建议将实际可用配置写入 `apps/api/.env`

### 3. 准备数据库

当前项目开发和生产统一按 PostgreSQL + Prisma migration 运行：

```bash
corepack pnpm db:generate
corepack pnpm db:migrate:deploy
corepack pnpm db:seed
```

### 4. 启动三端

```bash
corepack pnpm dev
```

默认本地地址：

- 用户端：`http://localhost:5174`
- 管理端：`http://localhost:5175`
- API：`http://localhost:3000/api`

## 常用命令

- `corepack pnpm dev`：同时启动三端
- `corepack pnpm dev:user`：仅启动用户端
- `corepack pnpm dev:admin`：仅启动管理端
- `corepack pnpm dev:api`：仅启动 API
- `corepack pnpm typecheck`：整仓类型检查
- `corepack pnpm build`：整仓构建
- `corepack pnpm db:generate`：生成 Prisma Client
- `corepack pnpm db:migrate:deploy`：执行正式迁移
- `corepack pnpm db:seed`：写入演示/开发 seed
- `corepack pnpm deploy:check`：发布前类型检查和构建校验
- `corepack pnpm release:verify`：`deploy:check` 的交付别名
- `corepack pnpm demo:prepare`：演示环境常用初始化流程

## 文档索引

- `DEPLOYMENT.md`：部署说明、域名绑定准备、环境变量说明
- `RELEASE_CHECKLIST.md`：上线前发布检查清单
- `DEMO_GUIDE.md`：演示账号、演示顺序和常见故障排查
- `HANDOVER.md`：运维/研发交接说明
- `KNOWN_LIMITATIONS.md`：当前已知限制
- `NEXT_PHASE_PLAN.md`：下一阶段迭代建议

## 部署索引

推荐部署形态：

- `admin-web`：静态部署
- `user-web`：静态部署
- `api`：Node 服务或 Docker 服务
- 数据库：外部 PostgreSQL

正式域名示例：

- 用户端：`https://app.example.com`
- 管理端：`https://admin.example.com`
- API：`https://api.example.com`

详细步骤请看 `DEPLOYMENT.md`

## 演示账号

仅适用于开发/演示环境：

- `end_user_demo / Demo123456`
- `merchant_admin_demo / Demo123456`
- `super_admin_demo / Demo123456`

## 注意事项

- 生产环境不要使用默认演示 seed
- 前端不要硬编码任何密钥
- `JWT_SECRET` 与 `JWT_REFRESH_SECRET` 必须分离配置
- 若使用子路径部署，请同步配置 `VITE_APP_BASE_PATH`
