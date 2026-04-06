<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { CartDetail, CartItem } from '@haodacai/shared'
import { deleteCartItem, getCart, updateCartItem } from '@/api/cart'

const cart = ref<CartDetail | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')
const actionMessage = ref('')
const pendingItemId = ref('')

const hasItems = computed(() => (cart.value?.items.length ?? 0) > 0)
const backTarget = computed(() => (cart.value?.shopId ? `/shop/${cart.value.shopId}` : '/home'))

const resolveErrorMessage = (error: unknown, fallbackMessage: string) =>
  error instanceof Error && error.message ? error.message : fallbackMessage

const loadCart = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    cart.value = await getCart()
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error, '购物车加载失败，请稍后重试。')
  } finally {
    isLoading.value = false
  }
}

const handleQuantityChange = async (item: CartItem, nextQuantity: number) => {
  if (nextQuantity < 1 || nextQuantity > item.stock || pendingItemId.value) {
    return
  }

  pendingItemId.value = item.id
  actionMessage.value = ''

  try {
    cart.value = await updateCartItem(item.id, {
      quantity: nextQuantity
    })
  } catch (error) {
    actionMessage.value = resolveErrorMessage(error, '更新购物车失败，请稍后重试。')
  } finally {
    pendingItemId.value = ''
  }
}

const handleDeleteItem = async (item: CartItem) => {
  if (pendingItemId.value) {
    return
  }

  pendingItemId.value = item.id
  actionMessage.value = ''

  try {
    cart.value = await deleteCartItem(item.id)
  } catch (error) {
    actionMessage.value = resolveErrorMessage(error, '删除购物车项失败，请稍后重试。')
  } finally {
    pendingItemId.value = ''
  }
}

onMounted(() => {
  void loadCart()
})
</script>

<template>
  <div class="cart-view">
    <header class="cart-view__hero">
      <RouterLink :to="backTarget" class="cart-view__back">继续逛逛</RouterLink>
      <h1>购物车</h1>
      <p>查看已选商品，确认数量后去结算。</p>

      <div class="cart-view__hero-links">
        <RouterLink class="cart-view__hero-link" to="/home">首页</RouterLink>
        <RouterLink class="cart-view__hero-link" to="/orders">我的订单</RouterLink>
      </div>
    </header>

    <main class="cart-view__content">
      <div v-if="isLoading" class="status-card">
        <h2>加载中</h2>
        <p>正在获取购物车...</p>
      </div>

      <div v-else-if="errorMessage" class="status-card status-card--error">
        <h2>加载失败</h2>
        <p>{{ errorMessage }}</p>
        <button type="button" class="status-card__button" @click="loadCart">重新加载</button>
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
            <span>合计</span>
            <strong>¥{{ cart?.totalAmount ?? 0 }}</strong>
          </div>
        </section>

        <p v-if="actionMessage" class="cart-view__message">{{ actionMessage }}</p>

        <div v-if="!hasItems" class="status-card">
          <h2>购物车还是空的</h2>
          <p>先去店铺页挑几样商品，再回来结算。</p>
          <RouterLink class="status-card__button status-card__button--link" to="/home">去逛首页</RouterLink>
        </div>

        <template v-else>
          <section class="cart-list">
            <article v-for="item in cart?.items" :key="item.id" class="cart-card">
              <div class="cart-card__thumb" :style="{ '--tone': item.thumbTone, '--accent': item.thumbAccent }">
                <span>{{ item.name.slice(0, 2) }}</span>
              </div>

              <div class="cart-card__content">
                <div class="cart-card__top">
                  <div>
                    <h2>{{ item.name }}</h2>
                    <p>{{ item.categoryName }} · 单价 ¥{{ item.price }}</p>
                  </div>
                  <button
                    type="button"
                    class="cart-card__delete"
                    :disabled="pendingItemId === item.id"
                    @click="handleDeleteItem(item)"
                  >
                    删除
                  </button>
                </div>

                <div class="cart-card__bottom">
                  <div class="quantity-stepper">
                    <button
                      type="button"
                      class="quantity-stepper__button"
                      :disabled="item.quantity <= 1 || pendingItemId === item.id"
                      @click="handleQuantityChange(item, item.quantity - 1)"
                    >
                      -
                    </button>
                    <strong>{{ item.quantity }}</strong>
                    <button
                      type="button"
                      class="quantity-stepper__button"
                      :disabled="item.quantity >= item.stock || pendingItemId === item.id"
                      @click="handleQuantityChange(item, item.quantity + 1)"
                    >
                      +
                    </button>
                  </div>

                  <strong class="cart-card__amount">¥{{ item.lineAmount }}</strong>
                </div>
              </div>
            </article>
          </section>

          <section class="checkout-bar">
            <div>
              <span>应付合计</span>
              <strong>¥{{ cart?.totalAmount ?? 0 }}</strong>
            </div>
            <RouterLink class="checkout-bar__button" to="/checkout">去结算</RouterLink>
          </section>
        </template>
      </template>
    </main>
  </div>
</template>

<style scoped lang="scss">
.cart-view {
  min-height: 100vh;
  max-width: 430px;
  margin: 0 auto;
  background: #fff;
}

.cart-view__hero {
  padding: calc(24px + env(safe-area-inset-top, 0px)) 18px 28px;
  background: linear-gradient(180deg, #8bd0a8 0%, #5ea56d 52%, #427b50 100%);
  color: #fff;
}

.cart-view__back {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  font-size: 12px;
  font-weight: 700;
}

.cart-view__hero h1 {
  margin: 14px 0 0;
  font-size: 28px;
}

.cart-view__hero p {
  margin: 8px 0 0;
  opacity: 0.92;
}

.cart-view__hero-links {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.cart-view__hero-link {
  display: inline-flex;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 12px;
  font-weight: 700;
}

.cart-view__content {
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

.cart-view__message {
  margin: 14px 0 0;
  color: #2ea451;
  font-size: 13px;
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.cart-card,
.status-card {
  padding: 16px;
  border-radius: 18px;
  background: #fffaf2;
}

.cart-card {
  display: grid;
  grid-template-columns: 84px 1fr;
  gap: 12px;
}

.cart-card__thumb {
  display: grid;
  place-items: center;
  min-height: 84px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--tone) 0%, var(--accent) 100%);
}

.cart-card__thumb span {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.35);
  color: #6e451c;
  font-weight: 800;
}

.cart-card__content {
  min-width: 0;
}

.cart-card__top,
.cart-card__bottom {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.cart-card__top h2 {
  margin: 0;
  font-size: 16px;
}

.cart-card__top p {
  margin: 6px 0 0;
  color: var(--hdc-muted);
  font-size: 12px;
}

.cart-card__delete {
  align-self: flex-start;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f6ece8;
  color: #c05f4b;
  font-size: 12px;
  font-weight: 700;
}

.cart-card__delete:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.cart-card__bottom {
  margin-top: 16px;
  align-items: center;
}

.cart-card__amount {
  color: #2daa4d;
  font-size: 16px;
}

.quantity-stepper {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 6px 8px;
  border-radius: 999px;
  background: #f5efdf;
}

.quantity-stepper strong {
  min-width: 18px;
  text-align: center;
}

.quantity-stepper__button {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fff;
  color: #6e451c;
  font-size: 16px;
  font-weight: 700;
}

.quantity-stepper__button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.checkout-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 18px;
  padding: 16px;
  border-radius: 18px;
  background: #f3fbf5;
}

.checkout-bar span {
  display: block;
  color: var(--hdc-muted);
  font-size: 12px;
}

.checkout-bar strong {
  display: block;
  margin-top: 6px;
  color: #2daa4d;
  font-size: 22px;
}

.checkout-bar__button,
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
