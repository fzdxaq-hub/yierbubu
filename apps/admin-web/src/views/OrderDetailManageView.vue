<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ADMIN_HEADER_ACTIONS, ADMIN_TABS, orderStatusValues } from '@haodacai/shared'
import type { OrderDetail, OrderStatus } from '@haodacai/shared'
import AppHeader from '@/components/AppHeader.vue'
import BottomTabBar from '@/components/BottomTabBar.vue'
import { getOrderById, updateOrderStatus } from '@/api/orders'

const route = useRoute()
const router = useRouter()

const order = ref<OrderDetail | null>(null)
const isLoading = ref(true)
const isUpdating = ref(false)
const errorMessage = ref('')
const actionMessage = ref('')

const routeOrderId = computed(() => String(route.params.orderId ?? ''))

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

const availableActions = computed<Array<{ label: string; status: OrderStatus; tone: 'primary' | 'danger' }>>(() => {
  if (!order.value) {
    return []
  }

  if (order.value.status === orderStatusValues.pendingPayment) {
    return [
      { label: '标记已支付', status: orderStatusValues.paid, tone: 'primary' },
      { label: '标记已取消', status: orderStatusValues.cancelled, tone: 'danger' }
    ]
  }

  if (order.value.status === orderStatusValues.paid) {
    return [
      { label: '标记已完成', status: orderStatusValues.completed, tone: 'primary' },
      { label: '标记已取消', status: orderStatusValues.cancelled, tone: 'danger' }
    ]
  }

  return []
})

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

const handleUpdateStatus = async (status: OrderStatus) => {
  if (!order.value || isUpdating.value) {
    return
  }

  isUpdating.value = true
  actionMessage.value = ''

  try {
    order.value = await updateOrderStatus(order.value.id, { status })
    actionMessage.value = `订单状态已更新为${formatStatus(status)}。`
  } catch (error) {
    actionMessage.value = resolveErrorMessage(error, '订单状态更新失败，请稍后重试。')
  } finally {
    isUpdating.value = false
  }
}

const handleTabSelect = (tabKey: string) => {
  if (tabKey === 'orders') {
    void router.push('/orders')
    return
  }

  if (tabKey === 'menu') {
    void router.push('/menus')
    return
  }

  const label = ADMIN_TABS.find((tab) => tab.key === tabKey)?.label ?? tabKey
  window.alert(`“${label}”页面还未接入，这一轮先聚焦订单运营。`)
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
  <div class="order-detail-manage-page">
    <div class="order-detail-manage-page__shell">
      <AppHeader title="订单详情" :actions="ADMIN_HEADER_ACTIONS" />

      <main class="order-detail-manage-page__content">
        <RouterLink to="/orders" class="order-detail-manage-page__back">返回订单列表</RouterLink>

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
            <h2>基础信息</h2>
            <p>订单号：{{ order.orderNo }}</p>
            <p>用户：{{ order.userId }}</p>
            <p>商品种类：{{ order.itemCount }} 种</p>
            <p>商品件数：{{ order.totalQuantity }} 件</p>
            <p>下单时间：{{ formatTime(order.createdAt) }}</p>
            <p>支付时间：{{ formatTime(order.paidAt) }}</p>
            <p>取消时间：{{ formatTime(order.cancelledAt) }}</p>
            <p>完成时间：{{ formatTime(order.completedAt) }}</p>
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

          <p v-if="actionMessage" class="order-detail-manage-page__message">{{ actionMessage }}</p>

          <section class="action-card">
            <div>
              <h2>状态流转</h2>
              <p>仅保留最小可运营动作：已支付、已完成、已取消。</p>
            </div>

            <div v-if="availableActions.length > 0" class="action-card__buttons">
              <button
                v-for="action in availableActions"
                :key="action.status"
                type="button"
                class="action-card__button"
                :class="`action-card__button--${action.tone}`"
                :disabled="isUpdating"
                @click="handleUpdateStatus(action.status)"
              >
                {{ isUpdating ? '提交中...' : action.label }}
              </button>
            </div>

            <p v-else class="action-card__tip">当前状态无需继续流转。</p>
          </section>
        </template>

        <div v-else class="status-card">
          <h2>暂无订单</h2>
          <p>没有找到对应的订单信息。</p>
        </div>
      </main>
    </div>

    <div class="order-detail-manage-page__tabbar">
      <BottomTabBar :tabs="ADMIN_TABS" active-tab="orders" @select="handleTabSelect" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.order-detail-manage-page {
  min-height: 100vh;
  background: #eff3ec;
}

.order-detail-manage-page__shell {
  max-width: 430px;
  min-height: 100vh;
  margin: 0 auto;
  background: #fff;
}

.order-detail-manage-page__content {
  padding: 12px 14px 100px;
}

.order-detail-manage-page__back {
  display: inline-flex;
  padding: 8px 14px;
  border-radius: 999px;
  background: #f3faf5;
  color: #3a5a44;
  font-size: 12px;
  font-weight: 700;
}

.summary-card {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
  padding: 16px;
  border-radius: 18px;
  background: #f3faf5;
}

.summary-card div {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-card span {
  color: #5d6959;
  font-size: 12px;
}

.summary-card strong {
  font-size: 18px;
}

.detail-card,
.action-card,
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
.action-card h2,
.status-card h2 {
  margin: 0;
  font-size: 18px;
}

.detail-card p,
.action-card p,
.status-card p {
  margin: 10px 0 0;
  color: #6f7a6d;
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

.order-detail-manage-page__message {
  margin: 14px 0 0;
  color: #2ea451;
  font-size: 13px;
}

.action-card__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.action-card__button,
.status-card__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}

.action-card__button--primary,
.status-card__button {
  background: #39b55d;
  color: #fff;
}

.action-card__button--danger {
  background: #f6ece8;
  color: #c05f4b;
}

.action-card__button:disabled,
.status-card__button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-card__tip {
  color: #7f8c7b;
  font-size: 13px;
}

.status-card--error {
  background: #fff5f3;
}

.status-card__button {
  margin-top: 14px;
}

.order-detail-manage-page__tabbar {
  position: fixed;
  left: 50%;
  bottom: 0;
  width: min(100%, 430px);
  transform: translateX(-50%);
  z-index: 8;
}
</style>
