<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { ProductListItem, ShopSummary } from '@haodacai/shared'
import { APP_BRAND_NAME } from '@haodacai/shared'
import { getShopProducts } from '@/api/products'
import { getActiveShop, getShopSummaries } from '@/api/shops'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()

const activeShop = ref<ShopSummary | null>(null)
const shops = ref<ShopSummary[]>([])
const featuredProducts = ref<ProductListItem[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

const shopCountLabel = computed(() => `${shops.value.length} 家`)
const featuredCountLabel = computed(() => `${featuredProducts.value.length} 款`)

const resolveErrorMessage = (error: unknown) =>
  error instanceof Error && error.message ? error.message : '首页加载失败，请稍后重试。'

const loadHome = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [currentShop, shopRows] = await Promise.all([getActiveShop(), getShopSummaries()])
    const products = await getShopProducts(currentShop.id)

    activeShop.value = currentShop
    shops.value = shopRows
    featuredProducts.value = products.filter((product) => product.status === 'onShelf').slice(0, 4)
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadHome()
})
</script>

<template>
  <div class="home-view">
    <header class="home-view__hero">
      <div class="home-view__hero-copy">
        <p class="home-view__eyebrow">用户端 H5</p>
        <h1 class="home-view__title">{{ APP_BRAND_NAME }}</h1>
        <p class="home-view__desc">
          {{ activeShop?.subtitle ?? '正在连接店铺与商品接口，带你直接浏览真实菜单内容。' }}
        </p>
      </div>

      <div class="home-view__hero-actions">
        <RouterLink v-if="activeShop" class="home-view__hero-action home-view__hero-action--primary" :to="`/shop/${activeShop.id}`">
          进入当前店铺
        </RouterLink>
        <RouterLink v-if="!authStore.isAuthenticated.value" class="home-view__hero-action" to="/login">登录</RouterLink>
        <RouterLink v-if="!authStore.isAuthenticated.value" class="home-view__hero-action" to="/register">注册</RouterLink>
        <RouterLink class="home-view__hero-action" to="/cart">购物车</RouterLink>
        <RouterLink class="home-view__hero-action" to="/orders">我的订单</RouterLink>
      </div>
    </header>

    <main class="home-view__content">
      <div v-if="isLoading" class="status-card">
        <h2>加载中</h2>
        <p>正在获取首页店铺和推荐商品...</p>
      </div>

      <div v-else-if="errorMessage" class="status-card status-card--error">
        <h2>加载失败</h2>
        <p>{{ errorMessage }}</p>
        <button type="button" class="status-card__button" @click="loadHome">重新加载</button>
      </div>

      <template v-else>
        <section class="home-view__section">
          <div class="home-view__section-head">
            <h2>推荐店铺</h2>
            <span>{{ shopCountLabel }}</span>
          </div>

          <div v-if="shops.length === 0" class="status-card status-card--inline">
            <h2>暂无店铺</h2>
            <p>当前还没有可展示的店铺信息。</p>
          </div>

          <RouterLink v-for="shop in shops" :key="shop.id" class="shop-card" :to="`/shop/${shop.id}`">
            <div class="shop-card__avatar">{{ shop.avatarLabel }}</div>
            <div class="shop-card__meta">
              <h3>{{ shop.name }}</h3>
              <p>{{ shop.subtitle }}</p>
            </div>
            <span class="shop-card__tag">{{ shop.recipeCount }} 件在售</span>
          </RouterLink>
        </section>

        <section class="home-view__section">
          <div class="home-view__section-head">
            <h2>今日推荐</h2>
            <span>{{ featuredCountLabel }}</span>
          </div>

          <div v-if="featuredProducts.length === 0" class="status-card status-card--inline">
            <h2>暂无推荐商品</h2>
            <p>当前店铺还没有上架中的商品。</p>
          </div>

          <div v-else class="recipe-grid">
            <RouterLink
              v-for="recipe in featuredProducts"
              :key="recipe.id"
              class="recipe-card"
              :to="`/product/${recipe.id}`"
            >
              <div class="recipe-card__thumb" :style="{ '--tone': recipe.thumbTone, '--accent': recipe.thumbAccent }">
                <span>{{ recipe.name.slice(0, 2) }}</span>
              </div>
              <h3>{{ recipe.name }}</h3>
              <p>价格 ¥{{ recipe.price }} · 销量 {{ recipe.sales }}</p>
            </RouterLink>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped lang="scss">
.home-view {
  min-height: 100vh;
  max-width: 430px;
  margin: 0 auto;
  background: #fff;
}

.home-view__hero {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: calc(24px + env(safe-area-inset-top, 0px)) 18px 28px;
  background:
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.32), transparent 20%),
    linear-gradient(180deg, #8bd0a8 0%, #5ea56d 52%, #427b50 100%);
  color: #fff;
}

.home-view__eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  opacity: 0.9;
}

.home-view__title {
  margin: 10px 0 0;
  font-size: 32px;
  font-weight: 800;
}

.home-view__desc {
  margin: 10px 0 0;
  max-width: 320px;
  line-height: 1.6;
  opacity: 0.92;
}

.home-view__hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.home-view__hero-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 88px;
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.home-view__hero-action--primary {
  background: rgba(255, 255, 255, 0.28);
}

.home-view__content {
  padding: 18px;
}

.home-view__section + .home-view__section {
  margin-top: 24px;
}

.home-view__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.home-view__section-head h2 {
  margin: 0;
  font-size: 18px;
}

.home-view__section-head span {
  color: var(--hdc-muted);
  font-size: 12px;
}

.shop-card {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border-radius: 18px;
  background: #f6fbf7;
}

.shop-card + .shop-card {
  margin-top: 10px;
}

.shop-card__avatar {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ffd7a7 0%, #d99058 100%);
  color: #6d4019;
  font-size: 26px;
  font-weight: 800;
}

.shop-card__meta h3 {
  margin: 0;
  font-size: 16px;
}

.shop-card__meta p {
  margin: 6px 0 0;
  color: var(--hdc-muted);
  font-size: 13px;
}

.shop-card__tag {
  padding: 6px 10px;
  border-radius: 999px;
  background: #e8f7ec;
  color: var(--hdc-green-500);
  font-size: 12px;
  font-weight: 700;
}

.recipe-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.recipe-card {
  display: block;
  padding: 12px;
  border-radius: 18px;
  background: #fffaf2;
}

.recipe-card__thumb {
  display: grid;
  place-items: center;
  height: 112px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--tone) 0%, var(--accent) 100%);
}

.recipe-card__thumb span {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.35);
  color: #6e451c;
  font-weight: 800;
}

.recipe-card h3 {
  margin: 12px 0 0;
  font-size: 15px;
}

.recipe-card p {
  margin: 8px 0 0;
  color: var(--hdc-muted);
  font-size: 12px;
}

.status-card {
  padding: 18px;
  border-radius: 18px;
  background: #f6fbf7;
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

.status-card--inline {
  margin-top: 4px;
}

.status-card__button {
  margin-top: 14px;
  padding: 10px 16px;
  border-radius: 999px;
  background: #41ba64;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}
</style>
