<script setup lang="ts">
import type { MenuTab } from '@/types/menu'

defineProps<{
  tabs: MenuTab[]
  activeTab: string
}>()

const emit = defineEmits<{
  select: [tabKey: string]
}>()
</script>

<template>
  <nav class="tabbar">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="tabbar__item"
      :class="{ 'tabbar__item--active': tab.key === activeTab }"
      type="button"
      @click="emit('select', tab.key)"
    >
      <span class="tabbar__icon"></span>
      <span class="tabbar__label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped lang="scss">
.tabbar {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: end;
  gap: 4px;
  padding: 9px 12px calc(10px + env(safe-area-inset-bottom, 0px));
  background: rgba(255, 255, 255, 0.98);
  border-top: 1px solid #ecefe9;
}

.tabbar__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  color: #8b9387;
}

.tabbar__item--active {
  color: #35af5d;
}

.tabbar__icon {
  position: relative;
  width: 20px;
  height: 20px;
}

.tabbar__icon::before,
.tabbar__icon::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid currentColor;
  border-radius: 5px;
}

.tabbar__item:nth-child(1) .tabbar__icon::before {
  border-radius: 2px;
  clip-path: polygon(0 0, 22% 0, 22% 100%, 0 100%);
}

.tabbar__item:nth-child(1) .tabbar__icon::after {
  left: 8px;
  right: 0;
  border-radius: 2px;
  clip-path: polygon(0 0, 32% 0, 32% 100%, 0 100%);
}

.tabbar__item:nth-child(2) .tabbar__icon::before {
  border-radius: 3px;
}

.tabbar__item:nth-child(2) .tabbar__icon::after {
  inset: 4px 4px 4px 8px;
  border-width: 0 0 2px 0;
  border-radius: 0;
}

.tabbar__item:nth-child(3) .tabbar__icon::before {
  clip-path: polygon(0 55%, 100% 0, 56% 100%);
  border-radius: 0;
}

.tabbar__item:nth-child(3) .tabbar__icon::after {
  display: none;
}

.tabbar__item:nth-child(4) .tabbar__icon::before {
  clip-path: polygon(50% 0, 100% 28%, 82% 100%, 18% 100%, 0 28%);
  border-radius: 7px;
}

.tabbar__item:nth-child(4) .tabbar__icon::after {
  display: none;
}

.tabbar__item:nth-child(5) .tabbar__icon::before {
  border-radius: 50%;
}

.tabbar__item:nth-child(5) .tabbar__icon::after {
  inset: 11px 4px 0;
  border-width: 2px 2px 0 2px;
  border-radius: 10px 10px 0 0;
}

.tabbar__label {
  font-size: 11px;
  font-weight: 600;
}
</style>
