import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/home'
    },
    {
      path: '/login',
      name: 'login',
      meta: {
        guestOnly: true
      },
      component: () => import('@/views/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      meta: {
        guestOnly: true
      },
      component: () => import('@/views/RegisterView.vue')
    },
    {
      path: '/home',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/shop/:shopId',
      name: 'shop',
      component: () => import('@/views/ShopView.vue')
    },
    {
      path: '/product/:productId',
      name: 'product',
      component: () => import('@/views/ProductDetailView.vue')
    },
    {
      path: '/cart',
      name: 'cart',
      meta: {
        requiresAuth: true
      },
      component: () => import('@/views/CartView.vue')
    },
    {
      path: '/checkout',
      name: 'checkout',
      meta: {
        requiresAuth: true
      },
      component: () => import('@/views/CheckoutView.vue')
    },
    {
      path: '/orders',
      name: 'orders',
      meta: {
        requiresAuth: true
      },
      component: () => import('@/views/OrdersView.vue')
    },
    {
      path: '/orders/:orderId',
      name: 'order-detail',
      meta: {
        requiresAuth: true
      },
      component: () => import('@/views/OrderDetailView.vue')
    }
  ]
})

authStore.setRedirectToLoginHandler((redirectPath) => {
  const targetPath = redirectPath ?? router.currentRoute.value.fullPath

  if (router.currentRoute.value.path === '/login') {
    return
  }

  void router.push({
    path: '/login',
    query: targetPath ? { redirect: targetPath } : undefined
  })
})

router.beforeEach(async (to) => {
  await authStore.initialize()

  if (to.meta.guestOnly && authStore.isAuthenticated.value) {
    const redirectPath = typeof to.query.redirect === 'string' ? to.query.redirect : '/home'
    return redirectPath
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated.value) {
    return {
      path: '/login',
      query: {
        redirect: to.fullPath
      }
    }
  }

  return true
})

export default router
