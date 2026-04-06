export const recipeStatusValues = {
  onShelf: 'onShelf',
  offShelf: 'offShelf'
} as const

export type RecipeStatus = (typeof recipeStatusValues)[keyof typeof recipeStatusValues]

export const categoryStatusValues = {
  enabled: 'enabled',
  disabled: 'disabled'
} as const

export type CategoryStatus = (typeof categoryStatusValues)[keyof typeof categoryStatusValues]

export const orderStatusValues = {
  pendingPayment: 'pending_payment',
  paid: 'paid',
  cancelled: 'cancelled',
  completed: 'completed'
} as const

export type OrderStatus = (typeof orderStatusValues)[keyof typeof orderStatusValues]

export type RecipeFormMode = 'create' | 'edit'

export interface HeaderAction {
  key: string
  label: string
}

export interface ShopInfo {
  id: string
  name: string
  subtitle: string
  avatarLabel: string
}

export interface ShopSummary extends ShopInfo {
  categoryCount: number
  recipeCount: number
}

export interface Recipe {
  id: string
  shopId: string
  categoryId: string
  name: string
  badge?: string
  cover?: string
  rating: number
  price: number
  points?: number
  sales: number
  stock: number
  isOnline: boolean
  tags: string[]
  thumbTone: string
  thumbAccent: string
  status: RecipeStatus
}

export interface RecipeFormInput {
  shopId: string
  categoryId: string
  name: string
  badge: string
  cover: string
  rating: number
  price: number
  sales: number
  stock: number
  tags: string[]
  status: RecipeStatus
}

export interface MenuCategory {
  id: string
  name: string
  sortOrder: number
  status: CategoryStatus
  recipes: Recipe[]
}

export interface CategorySummary {
  id: string
  name: string
  sortOrder: number
  status: CategoryStatus
  recipeCount: number
}

export interface ProductListItem extends Recipe {
  categoryName: string
}

export interface MenuTab {
  key: string
  label: string
}

export interface ShopMenuPayload {
  shop: ShopInfo
  categories: MenuCategory[]
}

export interface CartItem {
  id: string
  cartId: string
  productId: string
  shopId: string
  categoryId: string
  categoryName: string
  name: string
  badge?: string
  price: number
  quantity: number
  lineAmount: number
  stock: number
  status: RecipeStatus
  thumbTone: string
  thumbAccent: string
}

export interface CartDetail {
  id: string
  userId: string
  shopId?: string
  items: CartItem[]
  itemCount: number
  totalQuantity: number
  totalAmount: number
  updatedAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  categoryId: string
  categoryName: string
  name: string
  badge?: string
  price: number
  quantity: number
  lineAmount: number
  thumbTone: string
  thumbAccent: string
}

export interface OrderSummary {
  id: string
  orderNo: string
  userId: string
  shopId: string
  shopName: string
  status: OrderStatus
  itemCount: number
  totalQuantity: number
  totalAmount: number
  createdAt: string
  updatedAt: string
  paidAt?: string
  cancelledAt?: string
  completedAt?: string
}

export interface OrderDetail extends OrderSummary {
  items: OrderItem[]
}
