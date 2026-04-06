import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ADMIN_HEADER_ACTIONS, ADMIN_TABS } from '@haodacai/shared'
import { getShopCategories } from '@/api/categories'
import {
  batchUpdateProductStatus,
  createProduct,
  deleteProduct as deleteProductRequest,
  getShopProducts,
  updateProduct as updateProductRequest
} from '@/api/products'
import { getActiveShop, getShopMenu } from '@/api/shops'
import { createFallbackCategories, fallbackShop, fallbackShopSummary } from '@/fallback/menu'
import type {
  CategorySummary,
  MenuCategory,
  ProductListItem,
  Recipe,
  RecipeFormInput,
  RecipeStatus,
  ShopInfo,
  ShopMenuPayload,
  ShopSummary
} from '@/types/menu'

type DataSourceMode = 'api' | 'menu-fallback' | 'local-fallback'

const recipePalettes = [
  ['#f8d59c', '#d38852'],
  ['#f7c8cc', '#d38f95'],
  ['#f6e5a8', '#d3b148'],
  ['#d3efd9', '#78b487'],
  ['#d5e3ff', '#7c97cb'],
  ['#f4d9ff', '#b68ed6']
] as const

let recipeSeed = 100

const cloneShop = (shop: ShopInfo): ShopInfo => ({ ...shop })

const cloneRecipe = (recipe: Recipe): Recipe => ({
  ...recipe,
  tags: [...recipe.tags]
})

const cloneCategory = (category: MenuCategory): MenuCategory => ({
  ...category,
  recipes: category.recipes.map(cloneRecipe)
})

const buildShopSummary = (shop: ShopInfo, categories: MenuCategory[]): ShopSummary => ({
  ...shop,
  categoryCount: categories.length,
  recipeCount: categories.reduce((sum, category) => sum + category.recipes.length, 0)
})

const createLocalFallbackState = () => {
  const categories = createFallbackCategories()

  return {
    shop: cloneShop(fallbackShop),
    categories,
    summary: buildShopSummary(fallbackShop, categories)
  }
}

const toRecipe = (product: ProductListItem): Recipe => ({
  id: product.id,
  shopId: product.shopId,
  categoryId: product.categoryId,
  name: product.name,
  badge: product.badge,
  cover: product.cover,
  rating: product.rating,
  price: product.price,
  sales: product.sales,
  stock: product.stock,
  isOnline: product.isOnline,
  tags: [...product.tags],
  thumbTone: product.thumbTone,
  thumbAccent: product.thumbAccent,
  status: product.status
})

const toMenuCategories = (categoryRows: CategorySummary[], productRows: ProductListItem[]): MenuCategory[] => {
  const recipeMap = new Map<string, Recipe[]>()

  productRows.forEach((product) => {
    const categoryRecipes = recipeMap.get(product.categoryId) ?? []
    categoryRecipes.push(toRecipe(product))
    recipeMap.set(product.categoryId, categoryRecipes)
  })

  return categoryRows
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((category) => ({
      id: category.id,
      name: category.name,
      sortOrder: category.sortOrder,
      status: category.status,
      recipes: recipeMap.get(category.id) ?? []
    }))
}

const normalizeMenuPayload = (payload: ShopMenuPayload) => ({
  shop: cloneShop(payload.shop),
  categories: payload.categories.map(cloneCategory).sort((left, right) => left.sortOrder - right.sortOrder)
})

const findRecipeLocation = (categories: MenuCategory[], recipeId: string) => {
  for (const category of categories) {
    const recipeIndex = category.recipes.findIndex((recipe) => recipe.id === recipeId)

    if (recipeIndex >= 0) {
      return {
        category,
        recipeIndex,
        recipe: category.recipes[recipeIndex]
      }
    }
  }

  return null
}

const buildCreatePalette = (currentCount: number) => {
  const [thumbTone, thumbAccent] = recipePalettes[(recipeSeed + currentCount) % recipePalettes.length]

  recipeSeed += 1

  return {
    thumbTone,
    thumbAccent
  }
}

const normalizeTags = (tags: string[]) => tags.map((tag) => tag.trim()).filter(Boolean)

const resolveErrorMessage = (error: unknown, fallbackMessage: string) =>
  error instanceof Error && error.message ? error.message : fallbackMessage

const buildProductWritePayload = (
  input: RecipeFormInput,
  fallbackShopId: string,
  palette?: { thumbTone: string; thumbAccent: string }
) => ({
  shopId: input.shopId.trim() || fallbackShopId,
  categoryId: input.categoryId.trim(),
  name: input.name.trim(),
  badge: input.badge.trim() || undefined,
  cover: input.cover.trim() || undefined,
  rating: Math.max(1, Math.min(5, input.rating)),
  price: Math.max(0, input.price),
  sales: Math.max(0, input.sales),
  stock: Math.max(0, input.stock),
  isOnline: input.status === 'onShelf',
  tags: normalizeTags(input.tags),
  thumbTone: palette?.thumbTone,
  thumbAccent: palette?.thumbAccent
})

export const useMenuStore = defineStore('menu', () => {
  const initialState = createLocalFallbackState()

  const shop = ref<ShopInfo>(initialState.shop)
  const shopSummary = ref<ShopSummary>(fallbackShopSummary)
  const headerActions = ref([...ADMIN_HEADER_ACTIONS])
  const tabs = ref([...ADMIN_TABS])
  const categories = ref<MenuCategory[]>(initialState.categories)
  const activeCategoryId = ref(initialState.categories[0]?.id ?? '')
  const batchMode = ref(false)
  const selectedRecipeIds = ref<string[]>([])
  const isLoading = ref(false)
  const isMutating = ref(false)
  const isHydrated = ref(false)
  const loadError = ref<string | null>(null)
  const dataSource = ref<DataSourceMode>('local-fallback')

  const totalRecipes = computed(() =>
    categories.value.reduce((total, category) => total + category.recipes.length, 0)
  )

  const activeCategory = computed(
    () => categories.value.find((category) => category.id === activeCategoryId.value) ?? null
  )

  const selectedCount = computed(() => selectedRecipeIds.value.length)

  const dataSourceLabel = computed(() => {
    switch (dataSource.value) {
      case 'api':
        return '实时 API'
      case 'menu-fallback':
        return '菜单总接口兜底'
      default:
        return '本地兜底数据'
    }
  })

  const cleanupBatchState = () => {
    if (selectedRecipeIds.value.length === 0) {
      batchMode.value = false
    }
  }

  const removeSelection = (recipeId: string) => {
    selectedRecipeIds.value = selectedRecipeIds.value.filter((item) => item !== recipeId)
    cleanupBatchState()
  }

  const ensureActiveCategory = () => {
    if (!categories.value.some((category) => category.id === activeCategoryId.value)) {
      activeCategoryId.value = categories.value[0]?.id ?? ''
    }
  }

  const resetInteractions = () => {
    batchMode.value = false
    selectedRecipeIds.value = []
  }

  const applyCategories = (nextCategories: MenuCategory[]) => {
    categories.value = nextCategories.map(cloneCategory)
    ensureActiveCategory()
    resetInteractions()
  }

  const applyShopState = (nextShop: ShopInfo, nextCategories: MenuCategory[]) => {
    shop.value = cloneShop(nextShop)
    shopSummary.value = buildShopSummary(nextShop, nextCategories)
    applyCategories(nextCategories)
  }

  const useLocalFallback = (message?: string) => {
    const fallbackState = createLocalFallbackState()
    shop.value = fallbackState.shop
    shopSummary.value = fallbackState.summary
    applyCategories(fallbackState.categories)
    dataSource.value = 'local-fallback'
    loadError.value = message ?? '接口暂不可用，当前已切换到本地兜底数据。'
  }

  const bootstrap = async (force = false) => {
    if (isLoading.value) {
      return
    }

    if (isHydrated.value && !force) {
      return
    }

    isLoading.value = true

    try {
      const activeShop = await getActiveShop()

      try {
        const [categoryRows, productRows] = await Promise.all([
          getShopCategories(activeShop.id),
          getShopProducts(activeShop.id)
        ])

        const nextCategories = toMenuCategories(categoryRows, productRows)

        applyShopState(activeShop, nextCategories)
        dataSource.value = 'api'
        loadError.value = null
      } catch (catalogError) {
        const snapshot = await getShopMenu(activeShop.id)
        const normalizedSnapshot = normalizeMenuPayload(snapshot)

        applyShopState(normalizedSnapshot.shop, normalizedSnapshot.categories)
        dataSource.value = 'menu-fallback'
        loadError.value =
          '分类/商品接口暂未完全就绪，当前已自动切换到菜单总接口兜底。'

        console.warn('[menu-store] catalog endpoints failed, using menu snapshot fallback:', catalogError)
      }
    } catch (error) {
      useLocalFallback(resolveErrorMessage(error, '接口暂不可用，当前已切换到本地兜底数据。'))
      console.warn('[menu-store] bootstrap failed, using local fallback:', error)
    } finally {
      isLoading.value = false
      isHydrated.value = true
    }
  }

  const runMutation = async <T>(handler: () => Promise<T>) => {
    if (isMutating.value) {
      throw new Error('当前有商品操作正在进行，请稍后再试。')
    }

    isMutating.value = true

    try {
      return await handler()
    } finally {
      isMutating.value = false
    }
  }

  const getRecipeById = (recipeId: string) => findRecipeLocation(categories.value, recipeId)?.recipe ?? null

  const setActiveCategory = (categoryId: string) => {
    if (categories.value.some((category) => category.id === categoryId)) {
      activeCategoryId.value = categoryId
    }
  }

  const toggleRecipeSelection = (recipeId: string) => {
    batchMode.value = true

    if (selectedRecipeIds.value.includes(recipeId)) {
      removeSelection(recipeId)
      return
    }

    selectedRecipeIds.value = [...selectedRecipeIds.value, recipeId]
  }

  const exitBatchMode = () => {
    resetInteractions()
  }

  const addRecipe = async (input: RecipeFormInput) => {
    await runMutation(async () => {
      const palette = buildCreatePalette(totalRecipes.value)

      await createProduct(buildProductWritePayload(input, shop.value.id, palette))
      await bootstrap(true)
      setActiveCategory(input.categoryId)
    })
  }

  const updateRecipe = async (recipeId: string, input: RecipeFormInput) => {
    await runMutation(async () => {
      await updateProductRequest(recipeId, buildProductWritePayload(input, shop.value.id))
      await bootstrap(true)
      setActiveCategory(input.categoryId)
    })
  }

  const deleteRecipe = async (recipeId: string) => {
    await runMutation(async () => {
      await deleteProductRequest(recipeId)
      removeSelection(recipeId)
      await bootstrap(true)
    })
  }

  const batchDeleteSelected = () => {
    const selectedSet = new Set(selectedRecipeIds.value)

    categories.value = categories.value.map((category) => ({
      ...category,
      recipes: category.recipes.filter((recipe) => !selectedSet.has(recipe.id))
    }))

    exitBatchMode()
    ensureActiveCategory()
    shopSummary.value = buildShopSummary(shop.value, categories.value)
  }

  const batchSetStatus = async (status: RecipeStatus) => {
    const ids = [...selectedRecipeIds.value]
    const currentCategoryId = activeCategoryId.value

    if (ids.length === 0) {
      return
    }

    await runMutation(async () => {
      await batchUpdateProductStatus({
        ids,
        isOnline: status === 'onShelf'
      })

      await bootstrap(true)
      setActiveCategory(currentCategoryId)
    })
  }

  return {
    shop,
    shopSummary,
    headerActions,
    tabs,
    categories,
    activeCategoryId,
    batchMode,
    selectedRecipeIds,
    isLoading,
    isHydrated,
    loadError,
    dataSource,
    dataSourceLabel,
    totalRecipes,
    activeCategory,
    selectedCount,
    bootstrap,
    getRecipeById,
    setActiveCategory,
    toggleRecipeSelection,
    exitBatchMode,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    batchDeleteSelected,
    batchSetStatus
  }
})
