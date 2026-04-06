<script setup lang="ts">
import type { ShopInfo } from '@/types/menu'

defineProps<{
  shop: ShopInfo
  recipeTotal: number
}>()

const emit = defineEmits<{
  add: []
  exit: []
}>()
</script>

<template>
  <section class="shop-card">
    <div class="shop-card__avatar">
      <span class="shop-card__avatar-label">{{ shop.avatarLabel }}</span>
    </div>

    <div class="shop-card__meta">
      <h2 class="shop-card__name">{{ shop.name }}</h2>
      <p class="shop-card__desc">共{{ recipeTotal }}个菜谱</p>
    </div>

    <div class="shop-card__actions">
      <button class="shop-card__button shop-card__button--primary" type="button" @click="emit('add')">
        添加菜谱
      </button>
      <button class="shop-card__button shop-card__button--danger" type="button" @click="emit('exit')">
        退出管理
      </button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.shop-card {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 18px;
  background: rgba(42, 92, 52, 0.88);
  box-shadow: 0 16px 30px rgba(28, 61, 34, 0.24);
  color: #fff;
  backdrop-filter: blur(10px);
}

.shop-card__avatar {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border: 2px solid rgba(255, 255, 255, 0.42);
  border-radius: 16px;
  background:
    radial-gradient(circle at 34% 28%, #ffd7a7 0 32%, transparent 33%),
    radial-gradient(circle at 68% 72%, rgba(255, 255, 255, 0.26), transparent 24%),
    linear-gradient(135deg, #f7c98f 0%, #cc8a55 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

.shop-card__avatar-label {
  color: rgba(84, 46, 15, 0.86);
  font-size: 28px;
  font-weight: 800;
}

.shop-card__meta {
  min-width: 0;
}

.shop-card__name {
  margin: 0;
  font-size: 19px;
  font-weight: 800;
  line-height: 1.2;
}

.shop-card__desc {
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.84);
  font-size: 13px;
  font-weight: 600;
}

.shop-card__actions {
  display: flex;
  gap: 8px;
}

.shop-card__button {
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.shop-card__button--primary {
  background: linear-gradient(135deg, #59d87f 0%, #31b45b 100%);
  color: #fff;
}

.shop-card__button--danger {
  background: linear-gradient(135deg, #ff9c87 0%, #ff7d73 100%);
  color: #fff;
}

@media (max-width: 370px) {
  .shop-card {
    grid-template-columns: 58px minmax(0, 1fr);
  }

  .shop-card__actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
}
</style>
