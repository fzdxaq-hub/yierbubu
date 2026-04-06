<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminAuthStore } from '@/stores/auth'
import { pinia } from '@/stores/pinia'

const route = useRoute()
const router = useRouter()
const authStore = useAdminAuthStore(pinia)

const form = reactive({
  account: 'merchant_admin_demo',
  password: 'Demo123456'
})

const isSubmitting = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  if (isSubmitting.value) {
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await authStore.loginWithAccount({
      account: form.account,
      password: form.password
    })

    const redirectPath = typeof route.query.redirect === 'string' ? route.query.redirect : '/menus'
    await router.replace(redirectPath)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败，请稍后重试。'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="login-view">
    <header class="login-view__hero">
      <h1>管理端登录</h1>
      <p>merchant_admin / super_admin 登录后才可进入商品与订单管理。</p>
    </header>

    <main class="login-view__content">
      <section class="login-card">
        <h2>欢迎回来</h2>
        <p>已预填演示商家管理员账号，你也可以切换到超级管理员测试。</p>

        <label class="login-field">
          <span>账号</span>
          <input v-model="form.account" type="text" autocomplete="username" placeholder="请输入管理员账号" />
        </label>

        <label class="login-field">
          <span>密码</span>
          <input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            placeholder="请输入密码"
          />
        </label>

        <p v-if="errorMessage" class="login-card__error">{{ errorMessage }}</p>

        <button type="button" class="login-card__primary" :disabled="isSubmitting" @click="handleLogin">
          {{ isSubmitting ? '登录中...' : '登录管理端' }}
        </button>
      </section>

      <section class="login-tip">
        <h2>演示管理员账号</h2>
        <p>商家管理员：`merchant_admin_demo` / `Demo123456`</p>
        <p>超级管理员：`super_admin_demo` / `Demo123456`</p>
      </section>
    </main>
  </div>
</template>

<style scoped lang="scss">
.login-view {
  min-height: 100vh;
  max-width: 430px;
  margin: 0 auto;
  background: #fff;
}

.login-view__hero {
  padding: calc(24px + env(safe-area-inset-top, 0px)) 18px 28px;
  background: linear-gradient(180deg, #8fc8b0 0%, #6faa82 34%, #427950 72%, #356843 100%);
  color: #fff;
}

.login-view__hero h1 {
  margin: 0;
  font-size: 30px;
}

.login-view__hero p {
  margin: 10px 0 0;
  line-height: 1.6;
  opacity: 0.92;
}

.login-view__content {
  padding: 18px;
}

.login-card,
.login-tip {
  padding: 18px;
  border-radius: 18px;
  background: #f3faf5;
}

.login-tip {
  margin-top: 16px;
  background: #fffaf2;
}

.login-card h2,
.login-tip h2 {
  margin: 0;
  font-size: 20px;
}

.login-card p,
.login-tip p {
  margin: 10px 0 0;
  color: #5d6959;
  line-height: 1.6;
}

.login-field {
  display: block;
  margin-top: 16px;
}

.login-field span {
  display: block;
  margin-bottom: 8px;
  color: #41503f;
  font-size: 13px;
  font-weight: 700;
}

.login-field input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1px solid #d7ecdc;
  border-radius: 14px;
  background: #fff;
}

.login-card__error {
  color: #c05f4b;
  font-size: 13px;
}

.login-card__primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 44px;
  margin-top: 16px;
  border-radius: 999px;
  background: #39b55d;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}

.login-card__primary:disabled {
  background: #a9d8b5;
  cursor: not-allowed;
}
</style>
