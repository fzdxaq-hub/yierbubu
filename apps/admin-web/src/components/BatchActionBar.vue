<script setup lang="ts">
defineProps<{
  selectedCount: number
}>()

const emit = defineEmits<{
  cancel: []
  delete: []
  onShelf: []
  offShelf: []
}>()
</script>

<template>
  <div class="batch-action-bar">
    <div class="batch-action-bar__meta">
      <span class="batch-action-bar__count">{{ selectedCount }}</span>
      <span>项已选中</span>
    </div>
    <div class="batch-action-bar__actions">
      <button class="batch-action-bar__button batch-action-bar__button--ghost" type="button" @click="emit('cancel')">
        取消
      </button>
      <button class="batch-action-bar__button batch-action-bar__button--edit" type="button" @click="emit('onShelf')">
        批量上架
      </button>
      <button class="batch-action-bar__button batch-action-bar__button--ghost" type="button" @click="emit('offShelf')">
        批量下架
      </button>
      <button class="batch-action-bar__button batch-action-bar__button--danger" type="button" @click="emit('delete')">
        批量删除
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.batch-action-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 10px 26px rgba(84, 103, 80, 0.14);
}

.batch-action-bar__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #465242;
  font-size: 14px;
  font-weight: 700;
}

.batch-action-bar__count {
  display: inline-grid;
  place-items: center;
  min-width: 26px;
  height: 26px;
  padding: 0 8px;
  border-radius: 999px;
  background: #e8f8eb;
  color: #2eaa51;
}

.batch-action-bar__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.batch-action-bar__button {
  height: 34px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.batch-action-bar__button--ghost {
  background: #f2f4f1;
  color: #5e6b5b;
}

.batch-action-bar__button--edit {
  background: #42bb65;
  color: #fff;
}

.batch-action-bar__button--danger {
  border: 1px solid #ffb2a7;
  background: #fff;
  color: #ff8a7f;
}
</style>
