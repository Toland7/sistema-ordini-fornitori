import { Order, CreateOrderData } from '@/types'

export class OrderService {
  // Ottieni tutti gli ordini dell'utente
  static async getOrders(filters?: {
    supplier_id?: string
    status?: string
    date_from?: string
    date_to?: string
  }): Promise<Order[]> {
    try {
      // Simulazione dati per sviluppo
      const mockOrders: Order[] = [
        {
          id: '1',
          supplier_id: '1',
          supplier_name: 'Fornitore Carni Rossi',
          order_date: '2025-09-01',
          order_time: '09:30',
          status: 'sent',
          total_items: 2,
          total_amount: 58.50,
          notes: 'Consegna preferibilmente entro le 11:00',
          sent_method: 'whatsapp',
          sent_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: [
            {
              id: '1',
              order_id: '1',
              product_name: 'Bistecca di manzo',
              quantity: '2',
              unit: 'kg',
              price: 25.00,
              subtotal: 50.00,
              notes: ''
            },
            {
              id: '2',
              order_id: '1',
              product_name: 'Pollo intero',
              quantity: '1',
              unit: 'pezzi',
              price: 8.50,
              subtotal: 8.50,
              notes: ''
            }
          ]
        },
        {
          id: '2',
          supplier_id: '2',
          supplier_name: 'Ortofrutticola Verde',
          order_date: '2025-08-30',
          order_time: '08:15',
          status: 'confirmed',
          total_items: 2,
          total_amount: 68.00,
          notes: '',
          sent_method: 'email',
          sent_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: [
            {
              id: '3',
              order_id: '2',
              product_name: 'Pomodori',
              quantity: '10',
              unit: 'kg',
              price: 3.50,
              subtotal: 35.00,
              notes: ''
            },
            {
              id: '4',
              order_id: '2',
              product_name: 'Insalata mista',
              quantity: '15',
              unit: 'buste',
              price: 2.20,
              subtotal: 33.00,
              notes: ''
            }
          ]
        }
      ]

      // Applica filtri se presenti
      let filteredOrders = mockOrders
      
      if (filters?.supplier_id) {
        filteredOrders = filteredOrders.filter(order => order.supplier_id === filters.supplier_id)
      }
      if (filters?.status) {
        filteredOrders = filteredOrders.filter(order => order.status === filters.status)
      }
      if (filters?.date_from) {
        filteredOrders = filteredOrders.filter(order => order.order_date >= filters.date_from!)
      }
      if (filters?.date_to) {
        filteredOrders = filteredOrders.filter(order => order.order_date <= filters.date_to!)
      }

      return filteredOrders
    } catch (error) {
      console.error('Error fetching orders:', error)
      throw error
    }
  }

  // Ottieni un ordine specifico
  static async getOrder(id: string): Promise<Order | null> {
    try {
      const orders = await this.getOrders()
      return orders.find(o => o.id === id) || null
    } catch (error) {
      console.error('Error fetching order:', error)
      throw error
    }
  }

  // Crea nuovo ordine
  static async createOrder(orderData: CreateOrderData): Promise<Order> {
    try {
      // Simulazione creazione
      const newOrder: Order = {
        id: Math.random().toString(36).substr(2, 9),
        supplier_id: orderData.supplier_id,
        supplier_name: 'Mock Supplier',
        order_date: new Date().toISOString().split('T')[0],
        order_time: new Date().toTimeString().slice(0, 5),
        status: 'pending',
        total_items: orderData.items.length,
        total_amount: orderData.items.reduce((sum, item) => sum + (item.price || 0), 0),
        notes: orderData.notes,
        sent_method: null,
        sent_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: orderData.items.map(item => ({
          id: Math.random().toString(36).substr(2, 9),
          order_id: '',
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit || 'pezzi',
          price: item.price || 0,
          subtotal: item.price || 0,
          notes: ''
        }))
      }

      console.log('Created order:', newOrder)
      return newOrder
    } catch (error) {
      console.error('Error creating order:', error)
      throw error
    }
  }

  // Aggiorna status ordine
  static async updateOrderStatus(
    orderId: string, 
    status: Order['status'],
    sentMethod?: string
  ): Promise<Order> {
    try {
      console.log('Updating order status:', orderId, status, sentMethod)
      
      const orders = await this.getOrders()
      const order = orders.find(o => o.id === orderId)
      if (!order) throw new Error('Order not found')

      order.status = status
      if (status === 'sent') {
        order.sent_at = new Date().toISOString()
        order.sent_method = sentMethod || null
      }

      return order
    } catch (error) {
      console.error('Error updating order status:', error)
      throw error
    }
  }
}