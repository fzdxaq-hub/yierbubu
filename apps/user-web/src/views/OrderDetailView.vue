<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { orderStatusValues } from '@haodacai/shared'
import type { OrderDetail, OrderStatus } from '@haodacai/shared'
import { getOrderById, payOrder } from '@/api/orders'

const route = useRoute()

const order = ref<OrderDetail | null>(null)
const isLoading = ref(true)
const isPaying = ref(false)
const errorMessage = ref('')
const actionMessage = ref('')

const routeOrderId = computed(() => String(route.params.orderId ?? ''))
const canPay = computed(
  () => order.value?.status === orderStatusValues.pendingPayment && !isPaying.value
)

const resolveErrorMessage = (error: unknown, fallbackMessage: string) =>
  error instanceof Error && error.message ? error.message : fallbackMessage

const formatStatus = (status: OrderStatus) => {
  switch (status) {
    case orderStatusValues.paid:
      return '已支付'
    case orderStatusValues.cancelled:
      return '已取消'
    case orderStatusValues.completed:
      return '已完成'
    default:
      return '待支付'
  }
}

const formatTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '暂无'

const loadOrder = async () => {
  if (!routeOrderId.value) {
    errorMessage.value = '订单参数缺失。'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    order.value = await getOrderById(routeOrderId.value)
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error, '订单详情加载失败，请稍后重试。')
    order.value = null
  } finally {
    isLoading.value = false
  }
}

const handlePay = async () => {
  if (!order.value || !canPay.value) {
    return
  }

  isPaying.value = true
  actionMessage.value = ''

  try {
    order.value = await payOrder(order.value.id)
    actionMessage.value = '模拟支付成功，订单已更新为已支付。'
  } catch (error) {
    actionMessage.value = resolveErrorMessage(error, '模拟支付失败，请稍后重试。')
  } finally {
    isPaying.value = false
  }
}

watch(
  () => route.params.orderId,
  () => {
    void loadOrder()
  },
  { immediate: true }
)
</script>

<template>
  <div class="order-detail-view">
    <header class="order-detail-view__hero">
      <RouterLink to="/orders" class="order-detail-view__back">返回订单列表</RouterLink>
      <h1>订单详情</h1>
      <p>{{ order ? order.orderNo : '正在获取订单信息' }}</p>

      <div class="order-detail-view__hero-links">
        <RouterLink class="order-detail-view__hero-link" to="/home">首页</RouterLink>
        <RouterLink class="order-detail-view__hero-link" to="/cart">购物车</RouterLink>
      </div>
    </header>

    <main class="order-detail-view__content">
      <div v-if="isLoading" class="status-card">
        <h2>加载中</h2>
        <p>正在获取订单详情...</p>
      </div>

      <div v-else-if="errorMessage" class="status-card status-card--error">
        <h2>加载失败</h2>
        <p>{{ errorMessage }}</p>
        <button type="button" class="status-card__button" @click="loadOrder">重新加载</button>
      </div>

      <template v-else-if="order">
        <section class="summary-card">
          <div>
            <span>店铺</span>
            <strong>{{ order.shopName }}</strong>
          </div>
          <div>
            <span>状态</span>
            <strong>{{ formatStatus(order.status) }}</strong>
          </div>
          <div>
            <span>金额</span>
            <strong>¥{{ order.totalAmount }}</strong>
          </div>
        </section>

        <section class="detail-card">
          <h2>订单信息</h2>
          <p>订单号：{{ order.orderNo }}</p>
          <p>下单时间：{{ formatTime(order.createdAt) }}</p>
          <p>支付时间：{{ formatTime(order.paidAt) }}</p>
          <p>完成时间：{{ formatTime(order.completedAt) }}</p>
          <p>取消时间：{{ formatTime(order.cancelledAt) }}</p>
        </section>

        <section class="detail-card">
          <div class="detail-card__head">
            <h2>商品清单</h2>
            <span>{{ order.itemCount }} 种</span>
          </div>

          <article v-for="item in order.items" :key="item.id" class="order-item">
            <div class="order-item__thumb" :style="{ '--tone': item.thumbTone, '--accent': item.thumbAccent }">
              <span>{{ item.name.slice(0, 2) }}</span>
            </div>
            <div class="order-item__content">
              <h3>{{ item.name }}</h3>
              <p>{{ item.categoryName }} · x{{ item.quantity }}</p>
            </div>
            <strong>¥{{ item.lineAmount }}</strong>
          </article>
        </section>

        <p v-if="actionMessage" class="order-detail-view__message">{{ actionMessage }}</p>

        <section class="pay-bar">
          <div>
            <span>订单总额</span>
            <strong>¥{{ order.totalAmount }}</strong>
          </div>
          <button type="button" class="pay-bar__button" :disabled="!canPay" @click="handlePay">
            {{ isPaying ? '支付中...' : order.status === orderStatusValues.pendingPayment ? '模拟支付' : '已完成支付' }}
          </button>
        </section>
      </template>

      <div v-else class="status-card">
        <h2>暂无订单</h2>
        <p>没有找到对应的订单信息。</p>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.order-detail-view {
  min-height: 100vh;
  max-width: 430px;
  margin: 0 auto;
  background: #fff;
}

.order-detail-view__hero {
  padding: calc(24px + env(safe-area-inset-top, 0px)) 18px 28px;
  background: linear-gradient(180deg, #8bd0a8 0%, #5ea56d 52%, #427b50 100%);
  color: #fff;
}

.order-detail-view__back {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  font-size: 12px;
  font-weight: 700;
}

.order-detail-view__hero h1 {
  margin: 14px 0 0;
  font-size: 28px;
}

.order-detail-view__hero p {
  margin: 8px 0 0;
  opacity: 0.92;
}

.order-detail-view__hero-links {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.order-detail-view__hero-link {
  display: inline-flex;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 12px;
  font-weight: 700;
}

.order-detail-view__content {
  padding: 18px;
}

.summary-card {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 16px;
  border-radius: 18px;
  background: #f6fbf7;
}

.summary-card div {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-card span {
  color: var(--hdc-muted);
  font-size: 12px;
}

.summary-card strong {
  font-size: 18px;
}

.detail-card,
.status-card {
  margin-top: 16px;
  padding: 16px;
  border-radius: 18px;
  background: #fffaf2;
}

.detail-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.detail-card h2,
.status-card h2 {
  margin: 0;
  font-size: 18px;
}

.detail-card p,
.status-card p {
  margin: 10px 0 0;
  color: var(--hdc-muted);
  line-height: 1.6;
}

.order-item {
  display: grid;
  grid-template-columns: 72px 1fr auto;
  gap: 12px;
  align-items: center;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #f0e7d8;
}

.order-item__thumb {
  display: grid;
  place-items: center;
  min-height: 72px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--tone) 0%, var(--accent) 100%);
}

.order-item__thumb span {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.35);
  color: #6e451c;
  font-weight: 800;
}

.order-item__content h3 {
  margin: 0;
  font-size: 16px;
}

.order-item__content p {
  margin: 6px 0 0;
  font-size: 12px;
}

.order-detail-view__message {
  margin: 14px 0 0;
  color: #2ea451;
  font-size: 13px;
}

.pay-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 18px;
  padding: 16px;
  border-radius: 18px;
  background: #f3fbf5;
}

.pay-bar span {
  display: block;
  color: var(--hdc-muted);
  font-size: 12px;
}

.pay-bar strong {
  display: block;
  margin-top: 6px;
  color: #2daa4d;
  font-size: 22px;
}

.pay-bar__button,
.status-card__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  background: #41ba64;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.pay-bar__button:disabled {
  background: #afd8b9;
  cursor: not-allowed;
}

.status-card--error {
  background: #fff5f3;
}

.status-card__button {
  margin-top: 14px;
}
</style>
