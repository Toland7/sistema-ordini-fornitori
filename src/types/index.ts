export interface Supplier {
  id: string
  name: string
  contact_method: 'whatsapp' | 'email' | 'sms'
  contact_info: string
  message_template?: string
  is_active: boolean
  products: SupplierProduct[]
  created_at: string
  updated_at: string
}

export interface SupplierProduct {
  id: string
  supplier_id: string
  name: string
  unit: string
  default_quantity?: number
  price?: number
  notes?: string
  is_active: boolean
  sort_order: number
}

export interface Order {
  id: string
  supplier_id: string
  supplier_name?: string
  order_date: string
  order_time: string
  status: 'pending' | 'sent' | 'confirmed' | 'delivered' | 'cancelled'
  total_items: number
  total_amount: number
  notes?: string
  sent_method?: string
  sent_at?: string
  items: OrderItem[]
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_name: string
  quantity: string
  unit?: string
  price?: number
  subtotal?: number
  notes?: string
}

export interface ScheduledOrder {
  id: string
  supplier_id: string
  supplier_name?: string
  scheduled_date: string
  scheduled_time: string
  repeat_frequency: 'none' | 'daily' | 'weekly' | 'monthly'
  is_active: boolean
  last_executed?: string
  next_execution?: string
  notes?: string
  items: ScheduledOrderItem[]
}

export interface ScheduledOrderItem {
  id: string
  scheduled_order_id: string
  product_name: string
  quantity: string
  unit?: string
}

export interface CreateOrderData {
  supplier_id: string
  items: {
    product_name: string
    quantity: string
    unit?: string
    price?: number
  }[]
  notes?: string
}

export interface CreateSupplierData {
  name: string
  contact_method: 'whatsapp' | 'email' | 'sms'
  contact_info: string
  message_template?: string
  products: {
    name: string
    unit: string
    default_quantity?: number
    price?: number
    notes?: string
  }[]
}