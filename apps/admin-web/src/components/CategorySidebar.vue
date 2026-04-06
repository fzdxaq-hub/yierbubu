<script setup lang="ts">
import type { MenuCategory } from '@/types/menu'

defineProps<{
  categories: MenuCategory[]
  activeCategoryId: string
}>()

const emit = defineEmits<{
  select: [categoryId: string]
}>()
</script>

<template>
  <aside class="category-sidebar">
    <button
      v-for="category in categories"
      :key="category.id"
      class="category-sidebar__item"
      :class="{ 'category-sidebar__item--active': category.id === activeCategoryId }"
      type="button"
      @click="emit('select', category.id)"
    >
      <span class="category-sidebar__bar"></span>
      <span class="category-sidebar__name">{{ category.name }}</span>
    </button>
  </aside>
</template>

<style scoped lang="scss">
.category-sidebar {
  width: 86px;
  height: 100%;
  padding: 0;
  overflow-y: auto;
  background: #f5f5f2;
}

.category-sidebar__item {
  position: relative;
  width: 100%;
  min-height: 72px;
  padding: 0 10px 0 18px;
  border-radius: 0;
  background: #f5f5f2;
  color: #767f74;
  text-align: left;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.category-sidebar__item--active {
  background: #ffffff;
  color: #35af5d;
  font-weight: 700;
}

.category-sidebar__bar {
  position: absolute;
  left: 4px;
  top: 10px;
  bottom: 10px;
  width: 4px;
  border-radius: 999px;
  background: transparent;
}

.category-sidebar__item--active .category-sidebar__bar {
  background: linear-gradient(180deg, #62dc84 0%, #2da851 100%);
  box-shadow: 0 0 10px rgba(50, 177, 86, 0.35);
}

.category-sidebar__name {
  display: block;
  font-size: 14px;
  line-height: 1.35;
}
</style>
