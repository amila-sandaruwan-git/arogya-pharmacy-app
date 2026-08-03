import { supabase } from '../config/supabase'
import { Order, OrderItem, OrderItemInput } from '../types'
import { NotificationService } from './notification.service'

export const OrderService = {
  async createOrder(data: {
    userId: string
    items: OrderItemInput[]
    deliveryAddress: string
    paymentMethod: 'card' | 'cash'
    deliveryCharge: number
    notes?: string
  }): Promise<Order> {
    try {
      console.log('📦 ========== STARTING ORDER CREATION ==========')
      console.log('📦 User ID:', data.userId)
      console.log('📦 Items count:', data.items.length)
      console.log('📦 Payment method:', data.paymentMethod)
      console.log('📦 Delivery address:', data.deliveryAddress)
      
      // ✅ Generate 4-digit delivery code
      const deliveryCode = Math.floor(1000 + Math.random() * 9000).toString()
      console.log('🔑 Delivery code:', deliveryCode)
      
      // Calculate total
      const totalAmount = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const finalTotal = totalAmount + data.deliveryCharge
      console.log('💰 Total amount:', finalTotal)

      // ✅ Create order with proper payment status
      console.log('📝 Inserting order into database...')
      const orderInsert = {
        user_id: data.userId,
        delivery_code: deliveryCode,
        total_amount: finalTotal,
        delivery_address: data.deliveryAddress,
        delivery_charge: data.deliveryCharge,
        payment_method: data.paymentMethod,
        payment_status: data.paymentMethod === 'card' ? 'pending' : 'pending',
        order_status: 'pending',
        notes: data.notes || ''
      }
      console.log('📝 Order data:', JSON.stringify(orderInsert, null, 2))

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(orderInsert)
        .select()
        .single()

      if (orderError) {
        console.error('❌ ORDER INSERT ERROR:', orderError)
        throw new Error(`Order creation failed: ${orderError.message}`)
      }

      console.log('✅ Order created with ID:', orderData.id)

      // ✅ Create order items
      console.log('📝 Inserting order items...')
      const orderItems = data.items.map(item => ({
        order_id: orderData.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        selected_color: item.selected_color || null
      }))

      console.log('📝 Order items:', JSON.stringify(orderItems, null, 2))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('❌ ORDER ITEMS ERROR:', itemsError)
        throw new Error(`Order items failed: ${itemsError.message}`)
      }

      console.log('✅ Order items inserted')

      // ✅ Create delivery tracking
      console.log('📝 Creating delivery tracking...')
      const { error: trackingError } = await supabase
        .from('delivery_tracking')
        .insert({
          order_id: orderData.id,
          status: 'pending',
          updated_by: data.userId,
          notes: 'Order placed successfully'
        })

      if (trackingError) {
        console.error('⚠️ Tracking error (non-critical):', trackingError)
      }

      // ✅ Clear cart
      console.log('📝 Clearing cart...')
      const { error: cartError } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', data.userId)

      if (cartError) {
        console.error('⚠️ Cart clear error (non-critical):', cartError)
      }

      // ✅ Send notification
      try {
        await NotificationService.createOrderNotification(
          data.userId,
          orderData.id,
          'pending'
        )
      } catch (notifError) {
        console.error('⚠️ Notification error (non-critical):', notifError)
      }

      // ✅ Fetch complete order with items
      console.log('📝 Fetching complete order...')
      const { data: completeOrder, error: completeError } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('id', orderData.id)
        .single()

      if (completeError) {
        console.error('⚠️ Fetch complete error (non-critical):', completeError)
        return {
          ...orderData,
          items: orderItems
        } as Order
      }

      // ✅ Update pharmacist stats (async - don't wait)
      this.updatePharmacistStats(orderData.id).catch(console.error)

      console.log('✅ ========== ORDER CREATION COMPLETE ==========')
      return completeOrder

    } catch (error) {
      console.error('❌ ========== ORDER CREATION FAILED ==========')
      console.error('❌ Error:', error)
      throw error
    }
  },

  async getOrders(userId: string): Promise<Order[]> {
    try {
      console.log('📋 Fetching orders for user:', userId)
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Get orders error:', error)
        throw error
      }
      
      console.log(`📋 Found ${data?.length || 0} orders`)
      return data || []
    } catch (error) {
      console.error('Error getting orders:', error)
      return []
    }
  },

  async getPharmacistOrders(): Promise<Order[]> {
    try {
      console.log('📋 Fetching all orders for pharmacist...')
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*),
          user:users(id, username, phone_number, delivery_address)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Pharmacist orders error:', error)
        throw error
      }
      
      console.log(`📋 Found ${data?.length || 0} orders for pharmacist`)
      return data || []
    } catch (error) {
      console.error('Error getting pharmacist orders:', error)
      return []
    }
  },

  async getOrderById(orderId: string): Promise<Order> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*),
          user:users(id, username, phone_number, delivery_address)
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting order by id:', error)
      throw error
    }
  },

  async updateOrderStatus(orderId: string, status: string, userId: string): Promise<Order> {
    try {
      console.log(`📝 Updating order ${orderId} to status: ${status}`)
      
      // Get order to get user_id
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError) {
        console.error('❌ Error fetching order:', orderError)
        throw orderError
      }

      console.log('📋 Current order:', order)

      let deliveryCode = order.delivery_code
      if (status === 'shipping' && !deliveryCode) {
        // Generate 4-digit delivery code
        deliveryCode = Math.floor(1000 + Math.random() * 9000).toString()
        console.log('🔑 Generated delivery code:', deliveryCode)
      }

      const updateData: any = {
        order_status: status,
        updated_at: new Date().toISOString(),
      }

      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString()
      }

      if (deliveryCode) {
        updateData.delivery_code = deliveryCode
      }

      console.log('📝 Update data:', updateData)

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating order:', error)
        throw error
      }

      console.log('✅ Order updated successfully')

      // Send notification to user with delivery code if shipping
      try {
        await NotificationService.createOrderNotification(
          order.user_id,
          orderId,
          status,
          deliveryCode
        )
        console.log('📨 Notification sent to user')
      } catch (notifError) {
        console.error('⚠️ Notification error:', notifError)
      }

      // Add tracking entry
      const { error: trackingError } = await supabase
        .from('delivery_tracking')
        .insert({
          order_id: orderId,
          status: status,
          updated_by: userId,
          notes: `Order status updated to ${status}`,
        })

      if (trackingError) {
        console.error('⚠️ Tracking error:', trackingError)
      }

      return data
    } catch (error) {
      console.error('❌ Error updating order status:', error)
      throw error
    }
  },

  // ✅ NEW: Update payment status after successful payment
  async updateOrderPaymentStatus(
    orderId: string, 
    paymentStatus: 'paid' | 'failed' | 'refunded', 
    paymentId?: string
  ): Promise<Order> {
    try {
      console.log(`💳 Updating payment status for order ${orderId} to: ${paymentStatus}`)
      
      const { data, error } = await supabase
        .from('orders')
        .update({
          payment_status: paymentStatus,
          payment_id: paymentId || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating payment status:', error)
        throw error
      }

      console.log('✅ Payment status updated successfully')

      // Send notification
      try {
        await NotificationService.createOrderNotification(
          data.user_id,
          orderId,
          data.order_status,
          data.delivery_code
        )
      } catch (notifError) {
        console.error('⚠️ Notification error:', notifError)
      }

      return data
    } catch (error) {
      console.error('Error updating payment status:', error)
      throw error
    }
  },

  async getOrderTracking(orderId: string) {
    try {
      const { data, error } = await supabase
        .from('delivery_tracking')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting tracking:', error)
      return []
    }
  },

  async updatePharmacistStats(orderId: string): Promise<void> {
    try {
      console.log('📊 Updating pharmacist stats for order:', orderId)
      
      // Get order details
      const { data: order } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            product_id,
            quantity
          )
        `)
        .eq('id', orderId)
        .single()

      if (!order) {
        console.log('⚠️ Order not found for stats update')
        return
      }

      // Get pharmacist for the products
      const { data: product } = await supabase
        .from('products')
        .select('pharmacist_id')
        .eq('id', order.items[0]?.product_id)
        .single()

      if (!product?.pharmacist_id) {
        console.log('⚠️ No pharmacist found for product')
        return
      }

      console.log('👨‍⚕️ Pharmacist ID:', product.pharmacist_id)

      // Update stats
      const { data: stats } = await supabase
        .from('pharmacist_stats')
        .select('*')
        .eq('pharmacist_id', product.pharmacist_id)
        .single()

      if (stats) {
        console.log('📊 Updating existing stats')
        await supabase
          .from('pharmacist_stats')
          .update({
            total_orders: stats.total_orders + 1,
            total_revenue: stats.total_revenue + order.total_amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', stats.id)
      } else {
        console.log('📊 Creating new stats')
        await supabase
          .from('pharmacist_stats')
          .insert({
            pharmacist_id: product.pharmacist_id,
            total_orders: 1,
            total_revenue: order.total_amount,
            total_products: 0
          })
      }
      
      console.log('✅ Stats updated successfully')
    } catch (error) {
      console.error('Error updating pharmacist stats:', error)
    }
  },

  async getOrderStats(pharmacistId: string) {
    try {
      const { data, error } = await supabase
        .from('pharmacist_stats')
        .select('*')
        .eq('pharmacist_id', pharmacistId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data || null
    } catch (error) {
      console.error('Error getting order stats:', error)
      return null
    }
  },

  async getStatusCounts(pharmacistId: string) {
    try {
      const { data, error } = await supabase
        .rpc('get_order_status_counts', { pharmacist_id: pharmacistId })

      if (error) {
        console.error('❌ RPC error:', error)
        // Fallback: calculate from orders
        const orders = await this.getPharmacistOrders()
        const counts: Record<string, number> = {}
        orders.forEach(order => {
          counts[order.order_status] = (counts[order.order_status] || 0) + 1
        })
        return Object.entries(counts).map(([status, count]) => ({ status, count }))
      }
      
      return data || []
    } catch (error) {
      console.error('Error getting status counts:', error)
      return []
    }
  }
}