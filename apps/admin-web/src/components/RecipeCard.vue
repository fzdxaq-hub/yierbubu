<script setup lang="ts">
import { computed } from 'vue'
import type { Recipe } from '@/types/menu'

const props = defineProps<{
  recipe: Recipe
  batchMode: boolean
  selected: boolean
}>()

const emit = defineEmits<{
  imageClick: [recipeId: string]
  edit: [recipeId: string]
  remove: [recipeId: string]
}>()

const thumbStyle = computed(() => ({
  '--thumb-tone': props.recipe.thumbTone,
  '--thumb-accent': props.recipe.thumbAccent
}))

const shortLabel = computed(() => props.recipe.name.slice(0, 2))

const statusLabel = computed(() => (props.recipe.status === 'onShelf' ? '已上架' : '已下架'))
</script>

<template>
  <article class="recipe-card" :class="{ 'recipe-card--selected': selected }">
    <button class="recipe-card__thumb" :style="thumbStyle" type="button" @click="emit('imageClick', recipe.id)">
      <span class="recipe-card__ribbon" :class="`recipe-card__ribbon--${recipe.status}`">{{ statusLabel }}</span>
      <span v-if="batchMode" class="recipe-card__selector" :class="{ 'recipe-card__selector--active': selected }">
        {{ selected ? '✓' : '' }}
      </span>
      <span class="recipe-card__mark">{{ shortLabel }}</span>
    </button>

    <div class="recipe-card__body">
      <div class="recipe-card__head">
        <div class="recipe-card__title-wrap">
          <h3 class="recipe-card__title">{{ recipe.name }}</h3>
          <div class="recipe-card__stars" aria-label="评分">
            <span
              v-for="star in 5"
              :key="star"
              class="recipe-card__star"
              :class="{ 'recipe-card__star--active': star <= recipe.rating }"
            ></span>
          </div>
        </div>

        <div class="recipe-card__metrics">
          <span>销量 {{ recipe.sales }}</span>
          <span>库存 {{ recipe.stock }}</span>
        </div>
      </div>

      <div class="recipe-card__footer">
        <div class="recipe-card__price">¥{{ recipe.price }}</div>
        <div class="recipe-card__actions">
          <button class="recipe-card__action recipe-card__action--edit" type="button" @click="emit('edit', recipe.id)">
            编辑
          </button>
          <button
            class="recipe-card__action recipe-card__action--danger"
            type="button"
            @click="emit('remove', recipe.id)"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.recipe-card {
  display: grid;
  grid-template-columns: 74px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  padding: 8px 0 12px;
  border-bottom: 1px solid #f1f2ef;
  background: transparent;
  transition: background-color 0.2s ease;
}

.recipe-card--selected {
  margin: 0 -6px;
  padding: 8px 6px 12px;
  border-radius: 14px;
  background: #f1fbf4;
}

.recipe-card__thumb {
  position: relative;
  overflow: hidden;
  display: grid;
  place-items: center;
  width: 74px;
  height: 74px;
  border-radius: 12px;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.52), transparent 22%),
    radial-gradient(circle at 72% 72%, rgba(255, 255, 255, 0.24), transparent 24%),
    linear-gradient(135deg, var(--thumb-tone) 0%, var(--thumb-accent) 100%);
}

.recipe-card__ribbon {
  position: absolute;
  top: 7px;
  left: -22px;
  width: 86px;
  padding: 2px 0;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  text-align: center;
  transform: rotate(-42deg);
}

.recipe-card__ribbon--onShelf {
  background: #40b962;
}

.recipe-card__ribbon--offShelf {
  background: #a4aba1;
}

.recipe-card__selector {
  position: absolute;
  right: 5px;
  bottom: 5px;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border: 2px solid #fff;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.32);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
}

.recipe-card__selector--active {
  background: #33b05a;
  border-color: #33b05a;
}

.recipe-card__mark {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.34);
  color: rgba(88, 51, 18, 0.84);
  font-size: 14px;
  font-weight: 800;
}

.recipe-card__body {
  min-width: 0;
  padding-top: 2px;
}

.recipe-card__head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.recipe-card__title-wrap {
  min-width: 0;
}

.recipe-card__title {
  margin: 0;
  color: #222;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.25;
}

.recipe-card__metrics {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #c0c5bd;
  font-size: 12px;
  line-height: 1.2;
  text-align: right;
  white-space: nowrap;
}

.recipe-card__stars {
  display: flex;
  gap: 1px;
  margin-top: 5px;
}

.recipe-card__star::before {
  content: '★';
  color: #e0e0da;
  font-size: 11px;
  line-height: 1;
}

.recipe-card__star--active::before {
  color: #ffca3a;
}

.recipe-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 8px;
}

.recipe-card__price {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #2daa4d;
  font-size: 13px;
  font-weight: 800;
}

.recipe-card__price::before {
  content: '';
  width: 12px;
  height: 12px;
  border-radius: 50% 50% 50% 0;
  background: #3cbf62;
  transform: rotate(-45deg);
}

.recipe-card__actions {
  display: flex;
  gap: 8px;
}

.recipe-card__action {
  min-width: 50px;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.recipe-card__action--edit {
  background: #41ba64;
  color: #fff;
}

.recipe-card__action--danger {
  border: 1px solid #ffb0a6;
  background: #fff;
  color: #ff8d82;
}
</style>
