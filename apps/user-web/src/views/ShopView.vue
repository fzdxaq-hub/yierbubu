<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { CategorySummary, ProductListItem, ShopSummary } from '@haodacai/shared'
import { getShopCategories } from '@/api/categories'
import { getShopProducts } from '@/api/products'
import { getShopSummaries } from '@/api/shops'

const route = useRoute()

const shop = ref<ShopSummary | null>(null)
const categories = ref<CategorySummary[]>([])
const products = ref<ProductListItem[]>([])
const activeCategoryId = ref('')
const isPageLoading = ref(true)
const isProductsLoading = ref(false)
const errorMessage = ref('')

const routeShopId = computed(() => String(route.params.shopId ?? ''))
const pageTitle = computed(() => shop.value?.name ?? '店铺详情')

const resolveErrorMessage = (error: unknown) =>
  error instanceof Error && error.message ? error.message : '店铺页加载失败，请稍后重试。'

const loadProducts = async (shopId: string, categoryId?: string) => {
  isProductsLoading.value = true

  try {
    products.value = await getShopProducts(shopId, {
      categoryId
    })
  } finally {
    isProductsLoading.value = false
  }
}

const loadShopPage = async () => {
  const shopId = routeShopId.value

  if (!shopId) {
    errorMessage.value = '店铺参数缺失。'
    return
  }

  isPageLoading.value = true
  errorMessage.value = ''

  try {
    const [shopRows, categoryRows] = await Promise.all([getShopSummaries(), getShopCategories(shopId)])
    const targetShop = shopRows.find((item) => item.id === shopId) ?? null

    if (!targetShop) {
      throw new Error('店铺不存在。')
    }

    shop.value = targetShop
    categories.value = categoryRows
    activeCategoryId.value = categoryRows[0]?.id ?? ''

    await loadProducts(shopId, activeCategoryId.value || undefined)
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error)
  } finally {
    isPageLoading.value = false
  }
}

const handleCategoryChange = async (categoryId: string) => {
  if (!routeShopId.value || activeCategoryId.value === categoryId) {
    return
  }

  activeCategoryId.value = categoryId

  try {
    await loadProducts(routeShopId.value, categoryId || undefined)
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error)
  }
}

watch(
  () => route.params.shopId,
  () => {
    void loadShopPage()
  },
  { immediate: true }
)
</script>

<template>
  <div class="shop-view">
    <header class="shop-view__hero">
      <RouterLink to="/home" class="shop-view__back">返回首页</RouterLink>
      <h1>{{ pageTitle }}</h1>
      <p>{{ shop?.subtitle ?? `店铺 ID：${routeShopId}` }}</p>

      <div class="shop-view__quick-links">
        <RouterLink class="shop-view__quick-link" to="/cart">购物车</RouterLink>
        <RouterLink class="shop-view__quick-link" to="/orders">我的订单</RouterLink>
      </div>
    </header>

    <main class="shop-view__content">
      <div v-if="isPageLoading" class="status-card">
        <h2>加载中</h2>
        <p>正在获取店铺、分类和商品列表...</p>
      </div>

      <div v-else-if="errorMessage" class="status-card status-card--error">
        <h2>加载失败</h2>
        <p>{{ errorMessage }}</p>
        <button type="button" class="status-card__button" @click="loadShopPage">重新加载</button>
      </div>

      <template v-else>
        <section class="shop-view__summary">
          <div class="shop-view__avatar">{{ shop?.avatarLabel }}</div>
          <div>
            <h2>{{ shop?.name }}</h2>
            <p>{{ shop?.categoryCount }} 个分类 · {{ shop?.recipeCount }} 件商品</p>
          </div>
        </section>

        <section class="shop-view__section">
          <div class="shop-view__section-head">
            <h2>分类</h2>
            <span>{{ categories.length }} 个</span>
          </div>

          <div v-if="categories.length === 0" class="status-card status-card--inline">
            <h2>暂无分类</h2>
            <p>当前店铺还没有分类信息。</p>
          </div>

          <div v-else class="category-strip">
            <button
              v-for="category in categories"
              :key="category.id"
              type="button"
              class="category-chip"
              :class="{ 'category-chip--active': category.id === activeCategoryId }"
              @click="handleCategoryChange(category.id)"
            >
              {{ category.name }}
            </button>
          </div>
        </section>

        <section class="shop-view__section">
          <div class="shop-view__section-head">
            <h2>商品列表</h2>
            <span v-if="isProductsLoading">加载中...</span>
            <span v-else>{{ products.length }} 件</span>
          </div>

          <div v-if="isProductsLoading" class="status-card status-card--inline">
            <h2>正在切换分类</h2>
            <p>商品列表马上就到。</p>
          </div>

          <div v-else-if="products.length === 0" class="status-card status-card--inline">
            <h2>暂无商品</h2>
            <p>当前分类下还没有商品。</p>
          </div>

          <div v-else class="product-list">
            <RouterLink v-for="product in products" :key="product.id" class="product-card" :to="`/product/${product.id}`">
              <div class="product-card__thumb" :style="{ '--tone': product.thumbTone, '--accent': product.thumbAccent }">
                <span>{{ product.name.slice(0, 2) }}</span>
              </div>
              <div class="product-card__content">
                <div class="product-card__top">
                  <div>
                    <h3>{{ product.name }}</h3>
                    <p>{{ product.categoryName }}</p>
                  </div>
                  <span class="product-card__status" :class="`product-card__status--${product.status}`">
                    {{ product.status === 'onShelf' ? '已上架' : '已下架' }}
                  </span>
                </div>
                <div class="product-card__bottom">
                  <span>¥{{ product.price }}</span>
                  <span>销量 {{ product.sales }}</span>
                </div>
              </div>
            </RouterLink>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped lang="scss">
.shop-view {
  min-height: 100vh;
  max-width: 430px;
  margin: 0 auto;
  background: #fff;
}

.shop-view__hero {
  padding: calc(24px + env(safe-area-inset-top, 0px)) 18px 28px;
  background: linear-gradient(180deg, #8bd0a8 0%, #5ea56d 52%, #427b50 100%);
  color: #fff;
}

.shop-view__back {
  display: inline-flex;
  margin-bottom: 10px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  font-size: 12px;
  font-weight: 700;
}

.shop-view__hero h1 {
  margin: 0;
  font-size: 28px;
}

.shop-view__hero p {
  margin: 8px 0 0;
  opacity: 0.9;
}

.shop-view__quick-links {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.shop-view__quick-link {
  display: inline-flex;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 12px;
  font-weight: 700;
}

.shop-view__content {
  padding: 18px;
}

.shop-view__summary {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 14px;
  align-items: center;
  padding: 16px;
  border-radius: 18px;
  background: #f6fbf7;
}

.shop-view__summary h2 {
  margin: 0;
  font-size: 20px;
}

.shop-view__summary p {
  margin: 8px 0 0;
  color: var(--hdc-muted);
  font-size: 13px;
}

.shop-view__avatar {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: linear-gradient(135deg, #ffd7a7 0%, #d99058 100%);
  color: #6d4019;
  font-size: 28px;
  font-weight: 800;
}

.shop-view__section {
  margin-top: 20px;
}

.shop-view__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.shop-view__section-head h2 {
  margin: 0;
  font-size: 18px;
}

.shop-view__section-head span {
  color: var(--hdc-muted);
  font-size: 12px;
}

.category-strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.category-chip {
  flex-shrink: 0;
  padding: 10px 14px;
  border-radius: 999px;
  background: #f1f4ef;
  color: #5e6b5b;
  font-size: 13px;
  font-weight: 700;
}

.category-chip--active {
  background: #41ba64;
  color: #fff;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-card {
  display: grid;
  grid-template-columns: 84px 1fr;
  gap: 12px;
  padding: 12px;
  border-radius: 18px;
  background: #fffaf2;
}

.product-card__thumb {
  display: grid;
  place-items: center;
  min-height: 84px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--tone) 0%, var(--accent) 100%);
}

.product-card__thumb span {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.35);
  color: #6e451c;
  font-weight: 800;
}

.product-card__content {
  min-width: 0;
}

.product-card__top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.product-card__top h3 {
  margin: 0;
  font-size: 16px;
}

.product-card__top p {
  margin: 6px 0 0;
  color: var(--hdc-muted);
  font-size: 12px;
}

.product-card__status {
  flex-shrink: 0;
  align-self: flex-start;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.product-card__status--onShelf {
  background: #e8f7ec;
  color: #2ea451;
}

.product-card__status--offShelf {
  background: #eef0ec;
  color: #7b8578;
}

.product-card__bottom {
  display: flex;
  gap: 14px;
  margin-top: 14px;
  color: #2daa4d;
  font-size: 13px;
  font-weight: 700;
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
