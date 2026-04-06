<script setup lang="ts">
defineProps<{
  visible: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <div v-if="visible" class="confirm-dialog" @click.self="emit('cancel')">
    <div class="confirm-dialog__panel">
      <h3 class="confirm-dialog__title">{{ title }}</h3>
      <p class="confirm-dialog__desc">{{ description }}</p>
      <div class="confirm-dialog__actions">
        <button class="confirm-dialog__button confirm-dialog__button--ghost" type="button" @click="emit('cancel')">
          {{ cancelText ?? '取消' }}
        </button>
        <button class="confirm-dialog__button confirm-dialog__button--danger" type="button" @click="emit('confirm')">
          {{ confirmText ?? '确认' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.confirm-dialog {
  position: fixed;
  inset: 0;
  z-index: 25;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 16px;
  background: rgba(16, 23, 14, 0.48);
  backdrop-filter: blur(8px);
}

.confirm-dialog__panel {
  width: min(100%, 360px);
  padding: 22px;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 26px 80px rgba(34, 57, 34, 0.24);
}

.confirm-dialog__title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
}

.confirm-dialog__desc {
  margin: 10px 0 0;
  color: #758071;
  line-height: 1.6;
}

.confirm-dialog__actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.confirm-dialog__button {
  flex: 1;
  height: 42px;
  border-radius: 999px;
  font-weight: 700;
}

.confirm-dialog__button--ghost {
  background: #f1f4ef;
  color: #5e6b5b;
}

.confirm-dialog__button--danger {
  background: linear-gradient(135deg, #ff9b86 0%, #ff7d73 100%);
  color: #fff;
}
</style>
