<script setup lang="ts">
import type { MenuCategory } from '@/types/menu'
import RecipeCard from './RecipeCard.vue'

defineProps<{
  category: MenuCategory | null
  batchMode: boolean
  selectedRecipeIds: string[]
}>()

const emit = defineEmits<{
  sort: [categoryId: string]
  add: []
  imageClick: [recipeId: string]
  edit: [recipeId: string]
  remove: [recipeId: string]
}>()
</script>

<template>
  <section class="recipe-section">
    <template v-if="category">
      <header class="recipe-section__header">
        <div class="recipe-section__title">
          {{ category.name }}
          <span class="recipe-section__count">({{ category.recipes.length }})</span>
        </div>
        <button class="recipe-section__sort" type="button" @click="emit('sort', category.id)">菜谱排序</button>
      </header>

      <div v-if="category.recipes.length > 0" class="recipe-section__list">
        <RecipeCard
          v-for="recipe in category.recipes"
          :key="recipe.id"
          :recipe="recipe"
          :batch-mode="batchMode"
          :selected="selectedRecipeIds.includes(recipe.id)"
          @image-click="emit('imageClick', $event)"
          @edit="emit('edit', $event)"
          @remove="emit('remove', $event)"
        />
      </div>

      <div v-else class="recipe-section__empty">
        <h3 class="recipe-section__empty-title">这个分类还没有菜谱</h3>
        <p class="recipe-section__empty-desc">先添加第一条菜谱，后续再接入排序、上下架和批量操作。</p>
        <button class="recipe-section__empty-action" type="button" @click="emit('add')">立即添加</button>
      </div>
    </template>
  </section>
</template>

<style scoped lang="scss">
.recipe-section {
  min-height: 100%;
}

.recipe-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.recipe-section__title {
  color: #2d2d2d;
  font-size: 16px;
  font-weight: 800;
}

.recipe-section__count {
  color: #626a61;
}

.recipe-section__sort {
  height: 30px;
  padding: 0 12px;
  border-radius: 8px;
  background: #f5f6f4;
  color: #586457;
  font-size: 12px;
  font-weight: 700;
}

.recipe-section__list {
  display: flex;
  flex-direction: column;
}

.recipe-section__empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  min-height: 260px;
  padding: 24px 18px;
  border-radius: 18px;
  background: #fafbf8;
}

.recipe-section__empty-title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
}

.recipe-section__empty-desc {
  margin: 10px 0 0;
  color: #7d877a;
  line-height: 1.6;
}

.recipe-section__empty-action {
  margin-top: 16px;
  height: 38px;
  padding: 0 16px;
  border-radius: 999px;
  background: linear-gradient(135deg, #50d378 0%, #35af5d 100%);
  color: #fff;
  font-weight: 700;
}
</style>
