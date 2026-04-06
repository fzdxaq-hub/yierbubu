import type { HeaderAction, MenuTab } from './menu'

export const APP_BRAND_NAME = '好大一颗菜'
export const DEFAULT_ACTIVE_SHOP_ID = 'bear-house'
export const DEFAULT_END_USER_ID = 'end-user-demo'

export const ADMIN_HEADER_ACTIONS: HeaderAction[] = [
  { key: 'album', label: '图' },
  { key: 'qr', label: '码' },
  { key: 'share', label: '享' },
  { key: 'more', label: '...' }
]

export const ADMIN_TABS: MenuTab[] = [
  { key: 'menu', label: '菜谱' },
  { key: 'orders', label: '订单' },
  { key: 'discover', label: '发现' },
  { key: 'message', label: '消息' },
  { key: 'mine', label: '我的' }
]
