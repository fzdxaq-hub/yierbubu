<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  account: 'end_user_demo',
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

    const redirectPath = typeof route.query.redirect === 'string' ? route.query.redirect : '/home'
    await router.replace(redirectPath)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败，请稍后重试。'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="auth-view">
    <header class="auth-view__hero">
      <RouterLink to="/home" class="auth-view__back">返回首页</RouterLink>
      <h1>用户登录</h1>
      <p>登录后可查看自己的购物车、订单和支付状态。</p>
    </header>

    <main class="auth-view__content">
      <section class="auth-card">
        <h2>欢迎回来</h2>
        <p>测试账号已预填，你也可以先注册一个新的 end_user 账号。</p>

        <label class="auth-field">
          <span>账号</span>
          <input v-model="form.account" type="text" autocomplete="username" placeholder="请输入账号" />
        </label>

        <label class="auth-field">
          <span>密码</span>
          <input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            placeholder="请输入密码"
          />
        </label>

        <p v-if="errorMessage" class="auth-card__error">{{ errorMessage }}</p>

        <button type="button" class="auth-card__primary" :disabled="isSubmitting" @click="handleLogin">
          {{ isSubmitting ? '登录中...' : '登录' }}
        </button>

        <RouterLink class="auth-card__secondary" :to="{ path: '/register', query: route.query }">
          还没有账号，去注册
        </RouterLink>
      </section>

      <section class="auth-tip">
        <h2>演示账号</h2>
        <p>账号：`end_user_demo`</p>
        <p>密码：`Demo123456`</p>
      </section>
    </main>
  </div>
</template>

<style scoped lang="scss">
.auth-view {
  min-height: 100vh;
  max-width: 430px;
  margin: 0 auto;
  background: #fff;
}

.auth-view__hero {
  padding: calc(24px + env(safe-area-inset-top, 0px)) 18px 28px;
  background: linear-gradient(180deg, #8bd0a8 0%, #5ea56d 52%, #427b50 100%);
  color: #fff;
}

.auth-view__back {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  font-size: 12px;
  font-weight: 700;
}

.auth-view__hero h1 {
  margin: 14px 0 0;
  font-size: 28px;
}

.auth-view__hero p {
  margin: 8px 0 0;
  opacity: 0.92;
}

.auth-view__content {
  padding: 18px;
}

.auth-card,
.auth-tip {
  padding: 18px;
  border-radius: 18px;
  background: #f6fbf7;
}

.auth-tip {
  margin-top: 16px;
  background: #fffaf2;
}

.auth-card h2,
.auth-tip h2 {
  margin: 0;
  font-size: 20px;
}

.auth-card p,
.auth-tip p {
  margin: 10px 0 0;
  color: var(--hdc-muted);
  line-height: 1.6;
}

.auth-field {
  display: block;
  margin-top: 16px;
}

.auth-field span {
  display: block;
  margin-bottom: 8px;
  color: #41503f;
  font-size: 13px;
  font-weight: 700;
}

.auth-field input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1px solid #d8e8da;
  border-radius: 14px;
  background: #fff;
}

.auth-card__error {
  color: #c05f4b;
  font-size: 13px;
}

.auth-card__primary,
.auth-card__secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 44px;
  margin-top: 16px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
}

.auth-card__primary {
  background: #41ba64;
  color: #fff;
}

.auth-card__primary:disabled {
  background: #afd8b9;
  cursor: not-allowed;
}

.auth-card__secondary {
  background: #edf3ee;
  color: #4f6653;
}
</style>
