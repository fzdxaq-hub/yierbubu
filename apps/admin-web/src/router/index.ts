import { createRouter, createWebHistory } from 'vue-router'
import { useAdminAuthStore } from '@/stores/auth'
import { pinia } from '@/stores/pinia'

const authStore = useAdminAuthStore(pinia)

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/menus'
    },
    {
      path: '/login',
      name: 'admin-login',
      meta: {
        guestOnly: true
      },
      component: () => import('@/views/LoginView.vue')
    },
    {
      path: '/menus',
      name: 'menu-manage',
      meta: {
        requiresAuth: true
      },
      component: () => import('@/views/MenuManageView.vue')
    },
    {
      path: '/orders',
      name: 'orders-manage',
      meta: {
        requiresAuth: true
      },
      component: () => import('@/views/OrdersManageView.vue')
    },
    {
      path: '/orders/:orderId',
      name: 'order-manage-detail',
      meta: {
        requiresAuth: true
      },
      component: () => import('@/views/OrderDetailManageView.vue')
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

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    const redirectPath = typeof to.query.redirect === 'string' ? to.query.redirect : '/menus'
    return redirectPath
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
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
