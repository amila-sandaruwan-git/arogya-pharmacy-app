export interface User {
  id: string
  phone_number: string
  username: string
  full_name?: string 
  email?: string
  avatar_url?: string
  delivery_address?: string
  created_at: string
  updated_at: string
  is_pharmacist: boolean
  is_active: boolean
  last_login?: string
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  images: string[]
  quantity: number
  colors: ProductColor[]
  category?: string
  is_published: boolean
  is_popular: boolean
  created_at: string
  updated_at: string
  pharmacist_id: string
  sales_count: number
  rating: number
  total_reviews: number
}

export interface ProductColor {
  name: string
  hex: string
  stock: number
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  selected_color: string | null
  product?: Product
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  user_id: string
  delivery_code: string
  total_amount: number
  delivery_address: string
  delivery_charge: number
  payment_method: 'card' | 'cash'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  order_status: 'pending' | 'picking' | 'packing' | 'shipping' | 'delivered' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
  delivered_at?: string
  items: OrderItem[]
  user?: User
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  price: number
  selected_color: string | null
  created_at: string
}

export interface ChatMessage {
  id: string
  sender_id: string
  receiver_id: string
  order_id?: string
  message: string
  image_url?: string
  is_read: boolean
  is_delivered: boolean
  read_at?: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  data?: any
  type?: string
  is_read: boolean
  created_at: string
}

export interface OrderItemInput {
  product_id: string
  product_name: string
  quantity: number
  price: number
  selected_color: string | null
}