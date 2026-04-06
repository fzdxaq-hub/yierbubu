<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { APP_BRAND_NAME } from '@haodacai/shared'
import BatchActionBar from '@/components/BatchActionBar.vue'
import AppHeader from '@/components/AppHeader.vue'
import BottomTabBar from '@/components/BottomTabBar.vue'
import CategorySidebar from '@/components/CategorySidebar.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import RecipeFormModal from '@/components/RecipeFormModal.vue'
import RecipeSection from '@/components/RecipeSection.vue'
import ShopSummaryCard from '@/components/ShopSummaryCard.vue'
import { useMenuStore } from '@/stores/menu'
import type { RecipeFormInput, RecipeFormMode, RecipeStatus } from '@/types/menu'

const pageTitle = APP_BRAND_NAME
const store = useMenuStore()
const router = useRouter()

const resolveOperationMessage = (error: unknown, fallbackMessage: string) =>
  error instanceof Error && error.message ? error.message : fallbackMessage

const {
  shop,
  headerActions,
  categories,
  tabs,
  totalRecipes,
  activeCategoryId,
  activeCategory,
  batchMode,
  selectedCount,
  selectedRecipeIds,
  isLoading,
  isHydrated,
  loadError,
  dataSource,
  dataSourceLabel
} = storeToRefs(store)

const formVisible = ref(false)
const formMode = ref<RecipeFormMode>('create')
const editingRecipeId = ref<string | null>(null)

const confirmState = reactive({
  visible: false,
  title: '',
  description: '',
  confirmText: '确认',
  action: '' as 'singleDelete' | 'batchDelete' | ''
})

const showStatusBar = computed(() => isLoading.value || loadError.value || dataSource.value !== 'api')

const statusMessage = computed(() => {
  if (isLoading.value && !isHydrated.value) {
    return '正在同步店铺、分类和菜谱数据...'
  }

  if (isLoading.value) {
    return '正在重新加载最新数据...'
  }

  if (loadError.value) {
    return loadError.value
  }

  if (dataSource.value === 'menu-fallback') {
    return '分类和商品接口未就绪，当前已回退到菜单总接口兜底。'
  }

  if (dataSource.value === 'local-fallback') {
    return '当前使用本地兜底数据，后端恢复后可点击重新加载。'
  }

  return ''
})

const formInitialValue = computed<RecipeFormInput | null>(() => {
  if (!editingRecipeId.value) {
    return null
  }

  const recipe = store.getRecipeById(editingRecipeId.value)

  if (!recipe) {
    return null
  }

  return {
    shopId: recipe.shopId,
    categoryId: recipe.categoryId,
    name: recipe.name,
    badge: recipe.badge ?? '',
    cover: recipe.cover ?? '',
    rating: recipe.rating,
    price: recipe.price,
    sales: recipe.sales,
    stock: recipe.stock,
    tags: [...recipe.tags],
    status: recipe.status
  }
})

const currentDefaultShopId = computed(() => shop.value.id || '')
const currentDefaultCategoryId = computed(() => activeCategoryId.value || categories.value[0]?.id || '')

const closeForm = () => {
  formVisible.value = false
  editingRecipeId.value = null
}

const openAddForm = () => {
  store.exitBatchMode()
  formMode.value = 'create'
  editingRecipeId.value = null
  formVisible.value = true
}

const openEditForm = (recipeId: string) => {
  store.exitBatchMode()
  formMode.value = 'edit'
  editingRecipeId.value = recipeId
  formVisible.value = true
}

const submitForm = async (payload: RecipeFormInput) => {
  try {
    if (formMode.value === 'create') {
      await store.addRecipe(payload)
    } else if (editingRecipeId.value) {
      await store.updateRecipe(editingRecipeId.value, payload)
    }

    closeForm()
  } catch (error) {
    window.alert(resolveOperationMessage(error, '商品保存失败，请稍后重试。'))
  }
}

const openConfirm = (action: 'singleDelete' | 'batchDelete', title: string, description: string) => {
  confirmState.visible = true
  confirmState.action = action
  confirmState.title = title
  confirmState.description = description
  confirmState.confirmText = action === 'batchDelete' ? '删除所选' : '确认删除'
}

const closeConfirm = () => {
  if (confirmState.action === 'singleDelete') {
    editingRecipeId.value = null
  }

  confirmState.visible = false
  confirmState.action = ''
  confirmState.title = ''
  confirmState.description = ''
  confirmState.confirmText = '确认'
}

const requestDeleteRecipe = (recipeId: string) => {
  store.exitBatchMode()
  editingRecipeId.value = recipeId
  const recipe = store.getRecipeById(recipeId)
  openConfirm('singleDelete', '删除菜谱', `确认删除“${recipe?.name ?? '当前菜谱'}”吗？删除后将无法恢复。`)
}

const requestBatchDelete = () => {
  if (!selectedCount.value) {
    return
  }

  openConfirm('batchDelete', '批量删除', `当前已选择 ${selectedCount.value} 项，确认执行批量删除吗？`)
}

const confirmAction = async () => {
  try {
    if (confirmState.action === 'singleDelete' && editingRecipeId.value) {
      await store.deleteRecipe(editingRecipeId.value)
      editingRecipeId.value = null
    }

    if (confirmState.action === 'batchDelete') {
      store.batchDeleteSelected()
    }

    closeConfirm()
  } catch (error) {
    window.alert(resolveOperationMessage(error, '商品删除失败，请稍后重试。'))
  }
}

const handleCategorySelect = (categoryId: string) => {
  store.setActiveCategory(categoryId)
}

const handleRecipeImageClick = (recipeId: string) => {
  store.toggleRecipeSelection(recipeId)
}

const handleBatchStatus = async (status: RecipeStatus) => {
  if (!selectedCount.value) {
    return
  }

  try {
    await store.batchSetStatus(status)
  } catch (error) {
    window.alert(resolveOperationMessage(error, '批量上下架失败，请稍后重试。'))
  }
}

const handleTabSelect = (tabKey: string) => {
  if (tabKey === 'menu') {
    return
  }

  if (tabKey === 'orders') {
    void router.push('/orders')
    return
  }

  const label = tabs.value.find((tab) => tab.key === tabKey)?.label ?? tabKey
  window.alert(`“${label}”页面还未接入，这一轮先聚焦菜谱管理。`)
}

const handleSort = () => {
  window.alert('排序能力会在下一轮接入，这一版先优先完成真实 API 驱动。')
}

const handleExitManage = () => {
  window.alert('退出管理的权限流和确认逻辑会在下一版补齐。')
}

const handleReload = () => {
  void store.bootstrap(true)
}

onMounted(() => {
  void store.bootstrap()
})
</script>

<template>
  <div class="menu-manage-page">
    <div class="menu-manage-page__shell">
      <AppHeader :title="pageTitle" :actions="headerActions" />

      <div class="menu-manage-page__shop-card">
        <ShopSummaryCard :shop="shop" :recipe-total="totalRecipes" @add="openAddForm" @exit="handleExitManage" />
      </div>

      <div v-if="showStatusBar" class="menu-manage-page__status-bar">
        <div class="menu-manage-page__status-copy">
          <strong>{{ dataSourceLabel }}</strong>
          <span>{{ statusMessage }}</span>
        </div>
        <button class="menu-manage-page__status-action" type="button" :disabled="isLoading" @click="handleReload">
          {{ isLoading ? '同步中' : '重新加载' }}
        </button>
      </div>

      <main class="menu-manage-page__workspace">
        <CategorySidebar
          :categories="categories"
          :active-category-id="activeCategoryId"
          @select="handleCategorySelect"
        />

        <section class="menu-manage-page__content-panel">
          <div class="menu-manage-page__content-scroll">
            <RecipeSection
              :category="activeCategory"
              :batch-mode="batchMode"
              :selected-recipe-ids="selectedRecipeIds"
              @sort="handleSort"
              @add="openAddForm"
              @image-click="handleRecipeImageClick"
              @edit="openEditForm"
              @remove="requestDeleteRecipe"
            />
          </div>
        </section>
      </main>
    </div>

    <div class="menu-manage-page__floating-tip" v-if="!batchMode">
      <div class="menu-manage-page__batch-tip">
        <span class="menu-manage-page__batch-label">操作：</span>
        点击菜谱图片后可进行批量操作
      </div>
    </div>

    <div class="menu-manage-page__floating-tip" v-else>
      <BatchActionBar
        :selected-count="selectedCount"
        @cancel="store.exitBatchMode()"
        @delete="requestBatchDelete"
        @on-shelf="handleBatchStatus('onShelf')"
        @off-shelf="handleBatchStatus('offShelf')"
      />
    </div>

    <div class="menu-manage-page__floating-tabbar">
      <BottomTabBar :tabs="tabs" active-tab="menu" @select="handleTabSelect" />
    </div>

    <RecipeFormModal
      :visible="formVisible"
      :mode="formMode"
      :categories="categories"
      :default-shop-id="currentDefaultShopId"
      :default-category-id="currentDefaultCategoryId"
      :initial-value="formInitialValue"
      @close="closeForm"
      @submit="submitForm"
    />

    <ConfirmDialog
      :visible="confirmState.visible"
      :title="confirmState.title"
      :description="confirmState.description"
      :confirm-text="confirmState.confirmText"
      @confirm="confirmAction"
      @cancel="closeConfirm"
    />
  </div>
</template>

<style scoped lang="scss">
.menu-manage-page {
  min-height: 100vh;
  background: #eff3ec;
}

.menu-manage-page__shell {
  position: relative;
  display: flex;
  flex-direction: column;
  max-width: 430px;
  min-height: 100vh;
  margin: 0 auto;
  overflow: hidden;
  background: #fff;
}

.menu-manage-page__shop-card {
  position: relative;
  z-index: 2;
  margin: -44px 10px 0;
}

.menu-manage-page__status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 10px 10px 0;
  padding: 12px 14px;
  border-radius: 16px;
  background: #f3faf5;
  border: 1px solid #d7ecdc;
}

.menu-manage-page__status-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.menu-manage-page__status-copy strong {
  color: #2ea451;
  font-size: 13px;
}

.menu-manage-page__status-copy span {
  color: #5d6959;
  font-size: 12px;
  line-height: 1.45;
}

.menu-manage-page__status-action {
  flex-shrink: 0;
  min-width: 72px;
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: #39b55d;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.menu-manage-page__status-action:disabled {
  background: #a9d8b5;
  cursor: not-allowed;
}

.menu-manage-page__workspace {
  display: flex;
  gap: 0;
  height: calc(100vh - 172px - env(safe-area-inset-top, 0px));
  min-height: 420px;
  padding: 10px 0 154px;
}

.menu-manage-page__content-panel {
  flex: 1;
  min-width: 0;
  height: 100%;
  background: #fff;
}

.menu-manage-page__content-scroll {
  height: 100%;
  overflow-y: auto;
  padding: 8px 12px 18px 10px;
}

.menu-manage-page__floating-tip,
.menu-manage-page__floating-tabbar {
  position: fixed;
  left: 50%;
  width: min(100%, 430px);
  transform: translateX(-50%);
  z-index: 8;
}

.menu-manage-page__floating-tip {
  bottom: calc(62px + env(safe-area-inset-bottom, 0px));
  padding: 0 8px;
}

.menu-manage-page__floating-tabbar {
  bottom: 0;
}

.menu-manage-page__batch-tip {
  padding: 14px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 10px 26px rgba(84, 103, 80, 0.14);
  color: #ef9155;
  font-size: 14px;
  font-weight: 700;
}

.menu-manage-page__batch-label {
  color: #3b4539;
}

@media (max-width: 430px) {
  .menu-manage-page__workspace {
    height: calc(100vh - 172px - env(safe-area-inset-top, 0px));
  }
}
</style>
