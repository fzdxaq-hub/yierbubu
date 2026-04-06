<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { ProductListItem } from '@haodacai/shared'
import { addCartItem } from '@/api/cart'
import { getProductById } from '@/api/products'

const route = useRoute()

const product = ref<ProductListItem | null>(null)
const quantity = ref(1)
const isLoading = ref(true)
const isAddingToCart = ref(false)
const errorMessage = ref('')
const actionMessage = ref('')

const routeProductId = computed(() => String(route.params.productId ?? ''))
const detailTitle = computed(() => product.value?.name ?? '商品详情')
const canAddToCart = computed(
  () => !!product.value && product.value.status === 'onShelf' && product.value.stock > 0 && !isAddingToCart.value
)

const resolveErrorMessage = (error: unknown, fallbackMessage: string) =>
  error instanceof Error && error.message ? error.message : fallbackMessage

const loadProduct = async () => {
  const productId = routeProductId.value

  if (!productId) {
    errorMessage.value = '商品参数缺失。'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  actionMessage.value = ''

  try {
    product.value = await getProductById(productId)
    quantity.value = 1
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error, '商品详情加载失败，请稍后重试。')
    product.value = null
  } finally {
    isLoading.value = false
  }
}

const changeQuantity = (delta: number) => {
  if (!product.value) {
    return
  }

  const nextQuantity = Math.min(product.value.stock || 1, Math.max(1, quantity.value + delta))
  quantity.value = nextQuantity
}

const handleAddToCart = async () => {
  if (!product.value || !canAddToCart.value) {
    return
  }

  isAddingToCart.value = true
  actionMessage.value = ''

  try {
    await addCartItem({
      productId: product.value.id,
      quantity: quantity.value
    })

    actionMessage.value = '已加入购物车，可以继续选购或去结算。'
  } catch (error) {
    actionMessage.value = resolveErrorMessage(error, '加入购物车失败，请稍后重试。')
  } finally {
    isAddingToCart.value = false
  }
}

watch(
  () => route.params.productId,
  () => {
    void loadProduct()
  },
  { immediate: true }
)
</script>

<template>
  <div class="product-detail-view">
    <header class="product-detail-view__hero">
      <RouterLink v-if="product" :to="`/shop/${product.shopId}`" class="product-detail-view__back">
        返回店铺
      </RouterLink>
      <RouterLink v-else to="/home" class="product-detail-view__back">返回首页</RouterLink>

      <div
        class="product-detail-view__thumb"
        :style="product ? { '--tone': product.thumbTone, '--accent': product.thumbAccent } : undefined"
      >
        <span>{{ product?.name.slice(0, 2) ?? '菜品' }}</span>
      </div>

      <h1>{{ detailTitle }}</h1>
      <p v-if="product">{{ product.categoryName }} · {{ product.status === 'onShelf' ? '已上架' : '已下架' }}</p>
      <p v-else>正在连接真实商品详情接口。</p>

      <div class="product-detail-view__hero-links">
        <RouterLink class="product-detail-view__hero-link" to="/cart">购物车</RouterLink>
        <RouterLink class="product-detail-view__hero-link" to="/orders">我的订单</RouterLink>
      </div>
    </header>

    <main class="product-detail-view__content">
      <div v-if="isLoading" class="status-card">
        <h2>加载中</h2>
        <p>正在获取商品详情...</p>
      </div>

      <div v-else-if="errorMessage" class="status-card status-card--error">
        <h2>加载失败</h2>
        <p>{{ errorMessage }}</p>
        <button type="button" class="status-card__button" @click="loadProduct">重新加载</button>
      </div>

      <template v-else-if="product">
        <section class="detail-card">
          <div class="detail-card__row">
            <span>价格</span>
            <strong>¥{{ product.price }}</strong>
          </div>
          <div class="detail-card__row">
            <span>销量</span>
            <strong>{{ product.sales }}</strong>
          </div>
          <div class="detail-card__row">
            <span>库存</span>
            <strong>{{ product.stock }}</strong>
          </div>
          <div class="detail-card__row">
            <span>评分</span>
            <strong>{{ product.rating }} / 5</strong>
          </div>
        </section>

        <section class="detail-card">
          <h2>商品信息</h2>
          <p>所属分类：{{ product.categoryName }}</p>
          <p>店铺 ID：{{ product.shopId }}</p>
          <p>标签：{{ product.tags.length > 0 ? product.tags.join(' / ') : '暂无标签' }}</p>
          <p>角标：{{ product.badge ?? '暂无角标' }}</p>
        </section>

        <section class="detail-card">
          <div class="purchase-card__head">
            <h2>加入购物车</h2>
            <span>{{ product.status === 'onShelf' ? '可下单' : '暂不可下单' }}</span>
          </div>

          <div class="purchase-card__quantity">
            <span>数量</span>
            <div class="quantity-stepper">
              <button type="button" class="quantity-stepper__button" :disabled="quantity <= 1" @click="changeQuantity(-1)">
                -
              </button>
              <strong>{{ quantity }}</strong>
              <button
                type="button"
                class="quantity-stepper__button"
                :disabled="quantity >= product.stock"
                @click="changeQuantity(1)"
              >
                +
              </button>
            </div>
          </div>

          <p class="purchase-card__hint" v-if="product.status !== 'onShelf'">商品已下架，暂时不能加入购物车。</p>
          <p class="purchase-card__hint" v-else-if="product.stock <= 0">库存不足，暂时不能加入购物车。</p>
          <p class="purchase-card__message" v-if="actionMessage">{{ actionMessage }}</p>

          <div class="purchase-card__actions">
            <button type="button" class="purchase-card__primary" :disabled="!canAddToCart" @click="handleAddToCart">
              {{ isAddingToCart ? '加入中...' : '加入购物车' }}
            </button>
            <RouterLink class="purchase-card__secondary" to="/cart">查看购物车</RouterLink>
          </div>
        </section>
      </template>

      <div v-else class="status-card">
        <h2>暂无商品</h2>
        <p>没有找到对应的商品信息。</p>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.product-detail-view {
  min-height: 100vh;
  max-width: 430px;
  margin: 0 auto;
  background: #fff;
}

.product-detail-view__hero {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  padding: calc(24px + env(safe-area-inset-top, 0px)) 18px 28px;
  background:
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.28), transparent 24%),
    linear-gradient(180deg, #ffd9a6 0%, #e6a65d 52%, #bf7f3f 100%);
  color: #fff;
  text-align: center;
}

.product-detail-view__back {
  align-self: flex-start;
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  font-size: 12px;
  font-weight: 700;
}

.product-detail-view__thumb {
  display: grid;
  place-items: center;
  width: 132px;
  height: 132px;
  margin-top: 6px;
  border-radius: 28px;
  background: linear-gradient(135deg, var(--tone, #ffe0b5) 0%, var(--accent, #d99558) 100%);
  box-shadow: 0 18px 36px rgba(110, 69, 28, 0.18);
}

.product-detail-view__thumb span {
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.34);
  color: #6e451c;
  font-size: 20px;
  font-weight: 800;
}

.product-detail-view__hero h1 {
  margin: 0;
  font-size: 30px;
}

.product-detail-view__hero p {
  margin: 0;
  opacity: 0.92;
}

.product-detail-view__hero-links {
  display: flex;
  gap: 10px;
}

.product-detail-view__hero-link {
  display: inline-flex;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  font-size: 12px;
  font-weight: 700;
}

.product-detail-view__content {
  padding: 18px;
}

.detail-card,
.status-card {
  padding: 18px;
  border-radius: 18px;
  background: #fffaf2;
}

.detail-card + .detail-card,
.status-card + .detail-card {
  margin-top: 16px;
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

.detail-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f1e5d4;
}

.detail-card__row:last-child {
  border-bottom: none;
}

.detail-card__row span {
  color: var(--hdc-muted);
}

.detail-card__row strong {
  color: #2c2c2c;
  font-size: 16px;
}

.purchase-card__head,
.purchase-card__quantity,
.purchase-card__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.purchase-card__head span {
  color: #2daa4d;
  font-size: 12px;
  font-weight: 700;
}

.purchase-card__quantity {
  margin-top: 16px;
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

.purchase-card__hint,
.purchase-card__message {
  margin-top: 14px;
  font-size: 13px;
}

.purchase-card__message {
  color: #2ea451;
}

.purchase-card__actions {
  margin-top: 18px;
}

.purchase-card__primary,
.purchase-card__secondary,
.status-card__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}

.purchase-card__primary {
  flex: 1;
  background: #41ba64;
  color: #fff;
}

.purchase-card__primary:disabled {
  background: #afd8b9;
  cursor: not-allowed;
}

.purchase-card__secondary {
  background: #f3efe4;
  color: #6d644f;
}

.status-card--error {
  background: #fff5f3;
}

.status-card__button {
  margin-top: 14px;
  background: #41ba64;
  color: #fff;
}
</style>
