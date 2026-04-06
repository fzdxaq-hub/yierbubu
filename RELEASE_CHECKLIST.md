# 发布检查清单

## 1. 数据库准备

- [ ] 已创建生产 PostgreSQL 实例
- [ ] 已确认生产 `DATABASE_URL` 可用
- [ ] 已完成数据库备份策略确认
- [ ] 已执行 `corepack pnpm db:generate`
- [ ] 已执行 `corepack pnpm db:migrate:deploy`
- [ ] 已确认生产环境默认不执行演示 seed

## 2. 环境变量核对

### `apps/api`

- [ ] `NODE_ENV=production`
- [ ] `HOST=0.0.0.0`
- [ ] `PORT` 已由平台注入或显式配置
- [ ] `DATABASE_URL` 指向生产库
- [ ] `JWT_SECRET` 已替换为随机强密钥
- [ ] `JWT_REFRESH_SECRET` 已替换为随机强密钥
- [ ] `CORS_ALLOW_ORIGINS` 已填写正式用户端和管理端域名

### `apps/user-web`

- [ ] `VITE_API_BASE_URL` 指向正式 API 域名
- [ ] `VITE_APP_BASE_PATH` 与部署路径一致

### `apps/admin-web`

- [ ] `VITE_API_BASE_URL` 指向正式 API 域名
- [ ] `VITE_APP_BASE_PATH` 与部署路径一致

## 3. 前端构建核对

- [ ] 执行 `corepack pnpm --filter @haodacai/user-web build`
- [ ] 执行 `corepack pnpm --filter @haodacai/admin-web build`
- [ ] 已确认 `dist` 目录生成成功
- [ ] 已确认静态托管平台配置了 SPA history rewrite
- [ ] 已确认正式域名绑定完成

## 4. API 构建与健康检查

- [ ] 执行 `corepack pnpm --filter @haodacai/api build`
- [ ] 服务可监听 `0.0.0.0`
- [ ] `GET /api/health` 正常返回
- [ ] `GET /api/shops/active` 正常返回
- [ ] API 域名已配置 HTTPS

## 5. 登录验证

- [ ] end_user 登录成功
- [ ] merchant_admin 登录成功
- [ ] super_admin 登录成功
- [ ] refresh token 流程可用
- [ ] 退出登录后受保护页面会重新要求登录

## 6. 权限验证

- [ ] 未登录访问用户端购物车会跳转登录
- [ ] 未登录访问用户端订单会跳转登录
- [ ] 未登录访问管理端 `/menus` 会跳转登录
- [ ] 普通用户不能访问管理端商品写接口
- [ ] 普通用户不能访问管理端订单状态流转接口
- [ ] 管理员可访问商品和订单管理接口

## 7. 下单闭环验证

- [ ] 首页加载正常
- [ ] 商品详情加入购物车正常
- [ ] 购物车修改数量正常
- [ ] 提交订单正常
- [ ] 模拟支付正常
- [ ] 用户端订单列表与详情正常

## 8. 管理端订单流转验证

- [ ] 管理端订单列表正常
- [ ] 管理端按状态筛选正常
- [ ] 标记已支付正常
- [ ] 标记已完成正常
- [ ] 标记已取消正常

## 9. CORS 验证

- [ ] `app.example.com` 可以正常访问 API
- [ ] `admin.example.com` 可以正常访问 API
- [ ] 未在白名单中的域名不能跨域访问 API

## 10. History 路由验证

- [ ] 用户端刷新 `/home` 正常
- [ ] 用户端刷新 `/shop/:shopId` 正常
- [ ] 用户端刷新 `/orders/:orderId` 正常
- [ ] 管理端刷新 `/menus` 正常
- [ ] 管理端刷新 `/orders/:orderId` 正常

## 11. 发布最终签字项

- [ ] `corepack pnpm typecheck` 通过
- [ ] `corepack pnpm build` 通过
- [ ] 已完成回滚方案确认
- [ ] 已完成演示账号和生产账号区分确认
- [ ] 已通知相关验收人和运维执行时间窗口
