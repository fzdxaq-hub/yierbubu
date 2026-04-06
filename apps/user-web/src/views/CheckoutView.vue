<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { CartDetail } from '@haodacai/shared'
import { getCart } from '@/api/cart'
import { createOrder } from '@/api/orders'

const router = useRouter()

const cart = ref<CartDetail | null>(null)
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const actionMessage = ref('')

const hasItems = computed(() => (cart.value?.items.length ?? 0) > 0)
const backTarget = computed(() => (cart.value?.shopId ? `/shop/${cart.value.shopId}` : '/cart'))

const resolveErrorMessage = (error: unknown, fallbackMessage: string) =>
  error instanceof Error && error.message ? error.message : fallbackMessage

const loadCart = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    cart.value = await getCart()
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error, '结算页加载失败，请稍后重试。')
  } finally {
    isLoading.value = false
  }
}

const handleSubmitOrder = async () => {
  if (!hasItems.value || isSubmitting.value) {
    return
  }

  isSubmitting.value = true
  actionMessage.value = ''

  try {
    const order = await createOrder()
    await router.push(`/orders/${order.id}`)
  } catch (error) {
    actionMessage.value = resolveErrorMessage(error, '提交订单失败，请稍后重试。')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  void loadCart()
})
</script>

<template>
  <div class="checkout-view">
    <header class="checkout-view__hero">
      <RouterLink :to="backTarget" class="checkout-view__back">返回</RouterLink>
      <h1>确认下单</h1>
      <p>确认商品与数量后，提交订单并进入模拟支付。</p>

      <div class="checkout-view__hero-links">
        <RouterLink class="checkout-view__hero-link" to="/cart">购物车</RouterLink>
        <RouterLink class="checkout-view__hero-link" to="/orders">我的订单</RouterLink>
      </div>
    </header>

    <main class="checkout-view__content">
      <div v-if="isLoading" class="status-card">
        <h2>加载中</h2>
        <p>正在准备结算信息...</p>
      </div>

      <div v-else-if="errorMessage" class="status-card status-card--error">
        <h2>加载失败</h2>
        <p>{{ errorMessage }}</p>
        <button type="button" class="status-card__button" @click="loadCart">重新加载</button>
      </div>

      <template v-else>
        <div v-if="!hasItems" class="status-card">
          <h2>暂无可结算商品</h2>
          <p>购物车为空，先回去挑选商品吧。</p>
          <RouterLink class="status-card__button status-card__button--link" to="/cart">回到购物车</RouterLink>
        </div>

        <template v-else>
          <section class="summary-card">
            <div>
              <span>商品种类</span>
              <strong>{{ cart?.itemCount ?? 0 }}</strong>
            </div>
            <div>
              <span>总件数</span>
              <strong>{{ cart?.totalQuantity ?? 0 }}</strong>
            </div>
            <div>
              <span>应付金额</span>
              <strong>¥{{ cart?.totalAmount ?? 0 }}</strong>
            </div>
          </section>

          <section class="checkout-list">
            <article v-for="item in cart?.items" :key="item.id" class="checkout-card">
              <div class="checkout-card__thumb" :style="{ '--tone': item.thumbTone, '--accent': item.thumbAccent }">
                <span>{{ item.name.slice(0, 2) }}</span>
              </div>
              <div class="checkout-card__content">
                <h2>{{ item.name }}</h2>
                <p>{{ item.categoryName }} · x{{ item.quantity }}</p>
              </div>
              <strong class="checkout-card__amount">¥{{ item.lineAmount }}</strong>
            </article>
          </section>

          <p v-if="actionMessage" class="checkout-view__message">{{ actionMessage }}</p>

          <section class="submit-bar">
            <div>
              <span>提交后将创建待支付订单</span>
              <strong>¥{{ cart?.totalAmount ?? 0 }}</strong>
            </div>
            <button type="button" class="submit-bar__button" :disabled="isSubmitting" @click="handleSubmitOrder">
              {{ isSubmitting ? '提交中...' : '提交订单' }}
            </button>
          </section>
        </template>
      </template>
    </main>
  </div>
</template>

<style scoped lang="scss">
.checkout-view {
  min-height: 100vh;
  max-width: 430px;
  margin: 0 auto;
  background: #fff;
}

.checkout-view__hero {
  padding: calc(24px + env(safe-area-inset-top, 0px)) 18px 28px;
  background: linear-gradient(180deg, #8bd0a8 0%, #5ea56d 52%, #427b50 100%);
  color: #fff;
}

.checkout-view__back {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  font-size: 12px;
  font-weight: 700;
}

.checkout-view__hero h1 {
  margin: 14px 0 0;
  font-size: 28px;
}

.checkout-view__hero p {
  margin: 8px 0 0;
  opacity: 0.92;
}

.checkout-view__hero-links {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.checkout-view__hero-link {
  display: inline-flex;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 12px;
  font-weight: 700;
}

.checkout-view__content {
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

.checkout-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.checkout-card,
.status-card {
  display: grid;
  grid-template-columns: 72px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 16px;
  border-radius: 18px;
  background: #fffaf2;
}

.checkout-card__thumb {
  display: grid;
  place-items: center;
  min-height: 72px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--tone) 0%, var(--accent) 100%);
}

.checkout-card__thumb span {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.35);
  color: #6e451c;
  font-weight: 800;
}

.checkout-card__content h2 {
  margin: 0;
  font-size: 16px;
}

.checkout-card__content p {
  margin: 6px 0 0;
  color: var(--hdc-muted);
  font-size: 12px;
}

.checkout-card__amount {
  color: #2daa4d;
  font-size: 16px;
}

.checkout-view__message {
  margin: 14px 0 0;
  color: #c05f4b;
  font-size: 13px;
}

.submit-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 18px;
  padding: 16px;
  border-radius: 18px;
  background: #f3fbf5;
}

.submit-bar span {
  display: block;
  color: var(--hdc-muted);
  font-size: 12px;
}

.submit-bar strong {
  display: block;
  margin-top: 6px;
  color: #2daa4d;
  font-size: 22px;
}

.submit-bar__button,
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

.submit-bar__button:disabled {
  background: #afd8b9;
  cursor: not-allowed;
}

.status-card {
  display: block;
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
  margin-top: 14px;
}

.status-card__button--link {
  width: fit-content;
}
</style>
