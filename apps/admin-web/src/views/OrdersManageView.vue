<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ADMIN_HEADER_ACTIONS, ADMIN_TABS, orderStatusValues } from '@haodacai/shared'
import type { OrderStatus, OrderSummary } from '@haodacai/shared'
import AppHeader from '@/components/AppHeader.vue'
import BottomTabBar from '@/components/BottomTabBar.vue'
import { getOrders } from '@/api/orders'

const router = useRouter()

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

const emptyTitle = computed(() => (activeStatus.value ? '该状态下暂无订单' : '当前暂无订单'))

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
      scope: 'admin',
      status: activeStatus.value || undefined
    })
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

const handleTabSelect = (tabKey: string) => {
  if (tabKey === 'orders') {
    return
  }

  if (tabKey === 'menu') {
    void router.push('/menus')
    return
  }

  const label = ADMIN_TABS.find((tab) => tab.key === tabKey)?.label ?? tabKey
  window.alert(`“${label}”页面还未接入，这一轮先聚焦订单运营。`)
}

onMounted(() => {
  void loadOrders()
})

watch(activeStatus, () => {
  void loadOrders()
})
</script>

<template>
  <div class="orders-manage-page">
    <div class="orders-manage-page__shell">
      <AppHeader title="订单管理" :actions="ADMIN_HEADER_ACTIONS" />

      <main class="orders-manage-page__content">
        <section class="orders-manage-page__summary">
          <div>
            <span>筛选状态</span>
            <strong>{{ activeStatus ? formatStatus(activeStatus) : '全部订单' }}</strong>
          </div>
          <div>
            <span>当前结果</span>
            <strong>{{ orders.length }} 单</strong>
          </div>
        </section>

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
          <p>等用户完成下单后，这里会展示真实订单数据。</p>
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
              <span>商品 {{ order.itemCount }} 种 · 共 {{ order.totalQuantity }} 件</span>
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

    <div class="orders-manage-page__tabbar">
      <BottomTabBar :tabs="ADMIN_TABS" active-tab="orders" @select="handleTabSelect" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.orders-manage-page {
  min-height: 100vh;
  background: #eff3ec;
}

.orders-manage-page__shell {
  max-width: 430px;
  min-height: 100vh;
  margin: 0 auto;
  background: #fff;
}

.orders-manage-page__content {
  padding: 12px 14px 100px;
}

.orders-manage-page__summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 16px;
  border-radius: 18px;
  background: #f3faf5;
}

.orders-manage-page__summary div {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.orders-manage-page__summary span {
  color: #5d6959;
  font-size: 12px;
}

.orders-manage-page__summary strong {
  font-size: 18px;
}

.filter-strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  margin-top: 16px;
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
  background: #39b55d;
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
  color: #6f7a6d;
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
  color: #6f7a6d;
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
  color: #6f7a6d;
  line-height: 1.6;
}

.status-card--error {
  background: #fff5f3;
}

.status-card__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  margin-top: 14px;
  padding: 0 16px;
  border-radius: 999px;
  background: #39b55d;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.orders-manage-page__tabbar {
  position: fixed;
  left: 50%;
  bottom: 0;
  width: min(100%, 430px);
  transform: translateX(-50%);
  z-index: 8;
}
</style>
