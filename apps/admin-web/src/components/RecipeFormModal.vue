<script setup lang="ts">
import { reactive, watch } from 'vue'
import { defaultRecipeFormInput } from '@/fallback/menu'
import type { MenuCategory, RecipeFormInput, RecipeFormMode } from '@/types/menu'

const props = defineProps<{
  visible: boolean
  mode: RecipeFormMode
  categories: MenuCategory[]
  defaultShopId: string
  defaultCategoryId: string
  initialValue: RecipeFormInput | null
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: RecipeFormInput]
}>()

const form = reactive<RecipeFormInput>(defaultRecipeFormInput(props.defaultShopId, props.defaultCategoryId))

const resetForm = () => {
  const fallbackCategoryId = props.defaultCategoryId || props.categories[0]?.id || ''
  const base = props.initialValue ?? defaultRecipeFormInput(props.defaultShopId, fallbackCategoryId)
  Object.assign(form, base)
}

watch(
  () => [props.visible, props.initialValue, props.defaultShopId, props.defaultCategoryId],
  () => {
    if (props.visible) {
      resetForm()
    }
  },
  { immediate: true }
)

const submitForm = () => {
  const payload: RecipeFormInput = {
    shopId: props.defaultShopId || form.shopId,
    categoryId: form.categoryId,
    name: form.name.trim(),
    badge: form.badge.trim(),
    cover: form.cover.trim(),
    rating: Number(form.rating),
    price: Number(form.price),
    sales: Number(form.sales),
    stock: Number(form.stock),
    tags: form.tags.map((tag) => tag.trim()).filter(Boolean),
    status: form.status
  }

  if (!payload.name) {
    window.alert('请先填写菜谱名称。')
    return
  }

  emit('submit', payload)
}
</script>

<template>
  <div v-if="visible" class="recipe-form-modal" @click.self="emit('close')">
    <div class="recipe-form-modal__panel">
      <div class="recipe-form-modal__header">
        <div>
          <h3 class="recipe-form-modal__title">{{ mode === 'create' ? '添加菜谱' : '编辑菜谱' }}</h3>
          <p class="recipe-form-modal__desc">当前仍是原型阶段，新增和编辑会先更新本地状态，后续再接后端写接口。</p>
        </div>
        <button class="recipe-form-modal__close" type="button" @click="emit('close')">×</button>
      </div>

      <form class="recipe-form-modal__form" @submit.prevent="submitForm">
        <label class="recipe-form-modal__field">
          <span>所属分类</span>
          <select v-model="form.categoryId">
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </label>

        <label class="recipe-form-modal__field">
          <span>菜谱名称</span>
          <input v-model="form.name" type="text" maxlength="20" placeholder="请输入菜谱名称" />
        </label>

        <label class="recipe-form-modal__field">
          <span>图片角标</span>
          <input v-model="form.badge" type="text" maxlength="8" placeholder="例如：已上架 / 推荐" />
        </label>

        <div class="recipe-form-modal__grid">
          <label class="recipe-form-modal__field">
            <span>评分</span>
            <input v-model.number="form.rating" type="number" min="1" max="5" />
          </label>

          <label class="recipe-form-modal__field">
            <span>点数</span>
            <input v-model.number="form.price" type="number" min="0" />
          </label>
        </div>

        <div class="recipe-form-modal__grid">
          <label class="recipe-form-modal__field">
            <span>销量</span>
            <input v-model.number="form.sales" type="number" min="0" />
          </label>

          <label class="recipe-form-modal__field">
            <span>库存</span>
            <input v-model.number="form.stock" type="number" min="0" />
          </label>
        </div>

        <label class="recipe-form-modal__field">
          <span>上架状态</span>
          <select v-model="form.status">
            <option value="onShelf">已上架</option>
            <option value="offShelf">已下架</option>
          </select>
        </label>

        <div class="recipe-form-modal__footer">
          <button class="recipe-form-modal__button recipe-form-modal__button--ghost" type="button" @click="emit('close')">
            取消
          </button>
          <button class="recipe-form-modal__button recipe-form-modal__button--primary" type="submit">
            {{ mode === 'create' ? '创建菜谱' : '保存修改' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.recipe-form-modal {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 20px 16px;
  background: rgba(18, 28, 18, 0.42);
  backdrop-filter: blur(8px);
}

.recipe-form-modal__panel {
  width: min(100%, 430px);
  max-height: min(88vh, 720px);
  overflow-y: auto;
  padding: 20px;
  border-radius: 28px;
  background: #fff;
  box-shadow: 0 26px 80px rgba(34, 57, 34, 0.24);
}

.recipe-form-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.recipe-form-modal__title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
}

.recipe-form-modal__desc {
  margin: 8px 0 0;
  color: #7b8777;
  line-height: 1.5;
}

.recipe-form-modal__close {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #f2f5ef;
  color: #5b6658;
  font-size: 22px;
  line-height: 1;
}

.recipe-form-modal__form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 18px;
}

.recipe-form-modal__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.recipe-form-modal__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #445141;
  font-size: 14px;
  font-weight: 700;
}

.recipe-form-modal__field input,
.recipe-form-modal__field select {
  height: 44px;
  padding: 0 14px;
  border: 1px solid #dbe5d8;
  border-radius: 14px;
  outline: none;
  background: #f8fbf7;
  color: #1f2a1e;
}

.recipe-form-modal__footer {
  display: flex;
  gap: 10px;
  margin-top: 6px;
}

.recipe-form-modal__button {
  flex: 1;
  height: 42px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
}

.recipe-form-modal__button--ghost {
  background: #f1f4ef;
  color: #5e6b5b;
}

.recipe-form-modal__button--primary {
  background: linear-gradient(135deg, #50d378 0%, #35af5d 100%);
  color: #fff;
}
</style>
