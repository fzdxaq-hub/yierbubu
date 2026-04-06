# 演示指南

## 演示账号

仅适用于开发或演示环境：

- end_user：`end_user_demo / Demo123456`
- merchant_admin：`merchant_admin_demo / Demo123456`
- super_admin：`super_admin_demo / Demo123456`

## 推荐演示顺序

1. 先展示用户端首页、店铺页、商品详情
2. 再展示登录保护
3. 再展示购物车、下单、模拟支付
4. 再切到管理端查看订单与状态流转
5. 最后说明鉴权、角色和部署准备已完成

## 用户端演示路径

### 场景一：未登录保护

1. 打开 `/cart`
2. 展示自动跳转 `/login`
3. 使用 `end_user_demo` 登录
4. 登录成功后回到购物车页

### 场景二：商品浏览与下单

1. 打开 `/home`
2. 进入 `/shop/:shopId`
3. 打开 `/product/:productId`
4. 加入购物车
5. 进入 `/cart`
6. 修改数量
7. 进入 `/checkout`
8. 提交订单
9. 进入 `/orders/:orderId`
10. 完成模拟支付

### 场景三：订单查看

1. 打开 `/orders`
2. 查看订单列表
3. 进入订单详情页
4. 展示待支付、已支付等状态变化

## 管理端演示路径

### 场景一：登录保护

1. 直接打开管理端 `/menus`
2. 展示未登录跳转 `/login`
3. 使用 `merchant_admin_demo` 登录
4. 登录后回到原目标页面

### 场景二：商品管理

1. 进入 `/menus`
2. 展示已有真实商品读写能力
3. 说明商品写接口已做角色保护

### 场景三：订单运营

1. 进入 `/orders`
2. 按状态筛选订单
3. 打开订单详情
4. 标记已支付
5. 标记已完成
6. 演示已取消流转

## 演示时可强调的技术点

- 前后端都已接真实 API
- JWT + refresh token 已生效
- 用户端和管理端角色隔离
- 购物车与订单数据已绑定真实登录用户
- 构建、环境变量、静态部署和 API 部署说明已准备完成

## 演示中常见故障排查

### 登录失败

- 确认演示库已执行 `corepack pnpm db:seed`
- 确认账号密码未被改动
- 确认 API 环境变量中的 `JWT_SECRET` 和 `JWT_REFRESH_SECRET` 已配置

### 前端打不开数据

- 确认 `VITE_API_BASE_URL` 指向正确 API
- 确认 API 已启动并可访问 `/api/health`
- 确认 `CORS_ALLOW_ORIGINS` 包含当前前端域名

### 刷新页面 404

- 确认静态托管平台已配置 SPA rewrite
- 对 Vercel 检查 `vercel.json` 是否已生效

### 下单或订单列表异常

- 确认当前是 `end_user` 账号
- 确认数据库迁移已执行完成
- 确认演示数据未被清空

### 管理端操作无权限

- 确认当前登录的是 `merchant_admin` 或 `super_admin`
- 确认不是 `end_user` 账号误登管理端
