import { supabase } from '../config/supabase'
import { Notification } from '../types'

export const NotificationService = {
  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  },

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error fetching unread count:', error)
      return 0
    }
  },

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  },

  // ✅ Delete a single notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting notification:', error)
      throw error
    }
  },

  // ✅ Delete all notifications for a user
  async deleteAllNotifications(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting all notifications:', error)
      throw error
    }
  },

  // ✅ Delete all read notifications
  async deleteAllReadNotifications(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('is_read', true)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting read notifications:', error)
      throw error
    }
  },

  async createOrderNotification(
    userId: string,
    orderId: string,
    status: string,
    deliveryCode?: string
  ): Promise<void> {
    try {
      let title = ''
      let body = ''
      const data: any = { orderId, status }

      switch (status) {
        case 'pending':
          title = '🛒 Order Placed'
          body = 'Your order has been placed successfully!'
          break
        case 'picking':
          title = '📦 Order Being Picked'
          body = 'Your order is being picked by our team.'
          break
        case 'packing':
          title = '📦 Order Being Packed'
          body = 'Your order is being packed carefully.'
          break
        case 'shipping':
          title = '🚚 Order Shipped!'
          body = `Your order is on the way! Delivery Code: ${deliveryCode || 'N/A'}`
          if (deliveryCode) data.deliveryCode = deliveryCode
          break
        case 'delivered':
          title = '✅ Order Delivered'
          body = 'Your order has been delivered. Thank you for shopping with Arogya!'
          break
        default:
          title = `📋 Order ${status}`
          body = `Your order status has been updated to ${status}`
      }

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          body,
          data,
          type: 'order',
          is_read: false,
        })

      if (error) throw error
    } catch (error) {
      console.error('Error creating notification:', error)
    }
  },

  async createMessageNotification(
    userId: string,
    senderId: string,
    senderName: string,
    message: string
  ): Promise<void> {
    try {
      console.log('📝 Creating message notification for:', userId)
      
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: `💬 New message from ${senderName}`,
          body: message.length > 50 ? message.substring(0, 50) + '...' : message,
          data: { senderId },
          type: 'message',
          is_read: false,
        })

      if (error) {
        console.error('❌ Error creating notification:', error)
      }
    } catch (error) {
      console.error('Error creating message notification:', error)
    }
  },

  async createDeliveryKeyNotification(
    userId: string,
    orderId: string,
    deliveryCode: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: '🔑 Delivery Code Generated',
          body: `Your 4-digit delivery code is: ${deliveryCode}. Please share this with the delivery person.`,
          data: { orderId, deliveryCode },
          type: 'delivery',
          is_read: false,
        })

      if (error) throw error
    } catch (error) {
      console.error('Error creating delivery key notification:', error)
    }
  },

  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload)
        }
      )
      .subscribe()
  }
}