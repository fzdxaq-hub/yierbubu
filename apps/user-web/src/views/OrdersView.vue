<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { orderStatusValues } from '@haodacai/shared'
import type { OrderStatus, OrderSummary } from '@haodacai/shared'
import { getOrders } from '@/api/orders'

const orders = ref<OrderSummary[]>([])
const activeStatus = ref<OrderStatus | ''>('')
const isLoading = ref(true)
const errorMessage = ref('')

const filters: Array<{ label: string; value: OrderStatus | '' }> = [
  { label: '全部', value: '' },
  { label: '待支付', value: orderStatusValues.pendingPayment },
  { label: '已支付', value: orderStatusValues.paid },
  { label: '已取消', value: orderStatusValues.cancelled },
  { label: '已完成', value: orderStatusValues.completed }
]

const emptyTitle = computed(() => (activeStatus.value ? '当前状态下暂无订单' : '你还没有订单'))

const resolveErrorMessage = (error: unknown) =>
  error instanceof Error && error.message ? error.message : '订单列表加载失败，请稍后重试。'

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

const formatTime = (value: string) =>
  new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

const loadOrders = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    orders.value = await getOrders({
      status: activeStatus.value || undefined
    })
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadOrders()
})

watch(activeStatus, () => {
  void loadOrders()
})
</script>

<template>
  <div class="orders-view">
    <header class="orders-view__hero">
      <RouterLink to="/home" class="orders-view__back">返回首页</RouterLink>
      <h1>我的订单</h1>
      <p>查看下单记录，也可以继续完成待支付订单。</p>

      <div class="orders-view__hero-links">
        <RouterLink class="orders-view__hero-link" to="/cart">购物车</RouterLink>
        <RouterLink class="orders-view__hero-link" to="/home">继续点单</RouterLink>
      </div>
    </header>

    <main class="orders-view__content">
      <section class="filter-strip">
        <button
          v-for="filter in filters"
          :key="filter.label"
          type="button"
          class="filter-chip"
          :class="{ 'filter-chip--active': filter.value === activeStatus }"
          @click="activeStatus = filter.value"
        >
          {{ filter.label }}
        </button>
      </section>

      <div v-if="isLoading" class="status-card">
        <h2>加载中</h2>
        <p>正在获取订单列表...</p>
      </div>

      <div v-else-if="errorMessage" class="status-card status-card--error">
        <h2>加载失败</h2>
        <p>{{ errorMessage }}</p>
        <button type="button" class="status-card__button" @click="loadOrders">重新加载</button>
      </div>

      <div v-else-if="orders.length === 0" class="status-card">
        <h2>{{ emptyTitle }}</h2>
        <p>可以先去浏览商品，完成一次下单流程。</p>
        <RouterLink class="status-card__button status-card__button--link" to="/home">去逛首页</RouterLink>
      </div>

      <section v-else class="orders-list">
        <RouterLink v-for="order in orders" :key="order.id" class="order-card" :to="`/orders/${order.id}`">
          <div class="order-card__top">
            <div>
              <h2>{{ order.shopName }}</h2>
              <p>{{ order.orderNo }}</p>
            </div>
            <span class="order-card__status" :class="`order-card__status--${order.status}`">
              {{ formatStatus(order.status) }}
            </span>
          </div>

          <div class="order-card__meta">
            <span>{{ order.itemCount }} 种商品 · 共 {{ order.totalQuantity }} 件</span>
            <span>{{ formatTime(order.createdAt) }}</span>
          </div>

          <div class="order-card__bottom">
            <strong>¥{{ order.totalAmount }}</strong>
            <span>查看详情</span>
          </div>
        </RouterLink>
      </section>
    </main>
  </div>
</template>

<style scoped lang="scss">
.orders-view {
  min-height: 100vh;
  max-width: 430px;
  margin: 0 auto;
  background: #fff;
}

.orders-view__hero {
  padding: calc(24px + env(safe-area-inset-top, 0px)) 18px 28px;
  background: linear-gradient(180deg, #8bd0a8 0%, #5ea56d 52%, #427b50 100%);
  color: #fff;
}

.orders-view__back {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  font-size: 12px;
  font-weight: 700;
}

.orders-view__hero h1 {
  margin: 14px 0 0;
  font-size: 28px;
}

.orders-view__hero p {
  margin: 8px 0 0;
  opacity: 0.92;
}

.orders-view__hero-links {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.orders-view__hero-link {
  display: inline-flex;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 12px;
  font-weight: 700;
}

.orders-view__content {
  padding: 18px;
}

.filter-strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.filter-chip {
  flex-shrink: 0;
  padding: 10px 14px;
  border-radius: 999px;
  background: #f1f4ef;
  color: #5e6b5b;
  font-size: 13px;
  font-weight: 700;
}

.filter-chip--active {
  background: #41ba64;
  color: #fff;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.order-card,
.status-card {
  padding: 16px;
  border-radius: 18px;
  background: #fffaf2;
}

.order-card__top,
.order-card__meta,
.order-card__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.order-card__top h2 {
  margin: 0;
  font-size: 16px;
}

.order-card__top p {
  margin: 6px 0 0;
  color: var(--hdc-muted);
  font-size: 12px;
}

.order-card__status {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.order-card__status--pending_payment {
  background: #fff1d6;
  color: #d28a2a;
}

.order-card__status--paid {
  background: #e7f7eb;
  color: #2ea451;
}

.order-card__status--cancelled {
  background: #f5eded;
  color: #a76a60;
}

.order-card__status--completed {
  background: #edf2fb;
  color: #567ab8;
}

.order-card__meta {
  margin-top: 14px;
  color: var(--hdc-muted);
  font-size: 12px;
}

.order-card__bottom {
  margin-top: 14px;
}

.order-card__bottom strong {
  color: #2daa4d;
  font-size: 18px;
}

.order-card__bottom span {
  color: #7f8c7b;
  font-size: 12px;
  font-weight: 700;
}

.status-card h2 {
  margin: 0;
  font-size: 18px;
}

.status-card p {
  margin: 10px 0 0;
  color: var(--hdc-muted);
  line-height: 1.6;
}

.status-card--error {
  background: #fff5f3;
}

.status-card__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  margin-top: 14px;
  padding: 0 16px;
  border-radius: 999px;
  background: #41ba64;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.status-card__button--link {
  width: fit-content;
}
</style>
