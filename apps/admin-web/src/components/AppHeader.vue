<script setup lang="ts">
import type { HeaderAction } from '@/types/menu'

defineProps<{
  title: string
  actions: HeaderAction[]
}>()
</script>

<template>
  <header class="app-header">
    <div class="app-header__scene">
      <span class="app-header__cloud app-header__cloud--one"></span>
      <span class="app-header__cloud app-header__cloud--two"></span>
      <span class="app-header__hill app-header__hill--far"></span>
      <span class="app-header__hill app-header__hill--mid"></span>
      <span class="app-header__hill app-header__hill--near"></span>
    </div>

    <div class="app-header__top">
      <h1 class="app-header__title">{{ title }}</h1>
      <div class="app-header__actions">
        <button v-for="action in actions" :key="action.key" class="app-header__action" type="button">
          {{ action.label }}
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  position: relative;
  overflow: hidden;
  padding: calc(14px + env(safe-area-inset-top, 0px)) 14px 68px;
  background: linear-gradient(180deg, #8fc8b0 0%, #6faa82 34%, #427950 72%, #356843 100%);
  color: #fff;
}

.app-header__scene {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.app-header__cloud {
  position: absolute;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  filter: blur(2px);
}

.app-header__cloud::before,
.app-header__cloud::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: inherit;
}

.app-header__cloud--one {
  top: 18px;
  left: 16px;
  width: 78px;
  height: 24px;
}

.app-header__cloud--one::before {
  left: 10px;
  top: -10px;
  width: 28px;
  height: 28px;
}

.app-header__cloud--one::after {
  right: 12px;
  top: -8px;
  width: 26px;
  height: 26px;
}

.app-header__cloud--two {
  top: 44px;
  right: 18px;
  width: 92px;
  height: 26px;
}

.app-header__cloud--two::before {
  left: 14px;
  top: -10px;
  width: 30px;
  height: 30px;
}

.app-header__cloud--two::after {
  right: 12px;
  top: -12px;
  width: 34px;
  height: 34px;
}

.app-header__hill {
  position: absolute;
  left: -12%;
  right: -12%;
  bottom: -46px;
  border-radius: 50%;
}

.app-header__hill--far {
  height: 118px;
  background: rgba(42, 87, 52, 0.34);
}

.app-header__hill--mid {
  left: -18%;
  right: -4%;
  bottom: -54px;
  height: 126px;
  background: rgba(45, 92, 57, 0.52);
}

.app-header__hill--near {
  left: -6%;
  right: -16%;
  bottom: -68px;
  height: 138px;
  background: rgba(34, 73, 45, 0.68);
}

.app-header__top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.app-header__title {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.app-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-header__action {
  min-width: 30px;
  height: 30px;
  padding: 0 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.84);
  color: #365840;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 8px 20px rgba(20, 52, 29, 0.14);
}
</style>
