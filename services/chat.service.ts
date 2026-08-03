import { supabase } from '../config/supabase'
import { ChatMessage } from '../types'
import { Platform } from 'react-native'

const BUCKET_NAME = 'chat-images'

export const ChatService = {
  // =============================================
  // CONVERSATIONS
  // =============================================

  async getConversations(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:users!sender_id(id, username, avatar_url, is_pharmacist),
          receiver:users!receiver_id(id, username, avatar_url, is_pharmacist)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      const conversations: any = {}
      data?.forEach((msg: any) => {
        const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id
        const partner = msg.sender_id === userId ? msg.receiver : msg.sender
        
        if (!conversations[partnerId] || new Date(msg.created_at) > new Date(conversations[partnerId].created_at)) {
          conversations[partnerId] = {
            ...msg,
            partner_id: partnerId,
            partner_name: partner?.username || 'Unknown',
            partner_avatar: partner?.avatar_url,
            is_pharmacist: partner?.is_pharmacist || false,
            unread_count: msg.receiver_id === userId && !msg.is_read ? 1 : 0,
          }
        } else if (msg.receiver_id === userId && !msg.is_read) {
          conversations[partnerId].unread_count = (conversations[partnerId].unread_count || 0) + 1
        }
      })

      return Object.values(conversations)
    } catch (error) {
      console.error('Error getting conversations:', error)
      return []
    }
  },

  async getConversation(userId1: string, userId2: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting conversation:', error)
      return []
    }
  },

  // =============================================
  // MESSAGES
  // =============================================

  async sendMessage(data: {
    senderId: string
    receiverId: string
    message?: string
    imageUrl?: string
    orderId?: string
  }): Promise<ChatMessage> {
    try {
      if (!data.senderId || !data.receiverId) {
        throw new Error('Sender and receiver are required')
      }
      if (!data.message && !data.imageUrl) {
        throw new Error('Message or image is required')
      }

      const { data: message, error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: data.senderId,
          receiver_id: data.receiverId,
          message: data.message || '',
          image_url: data.imageUrl || null,
          order_id: data.orderId || null,
          is_read: false,
          is_delivered: false,
        })
        .select()
        .single()

      if (error) throw error
      return message
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  },

  // =============================================
  // READ STATUS
  // =============================================

  async markAsRead(messageId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', messageId)

      if (error) throw error
    } catch (error) {
      console.error('Error marking as read:', error)
      throw error
    }
  },

  async markAllAsRead(userId: string, partnerId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('sender_id', partnerId)
        .eq('receiver_id', userId)
        .eq('is_read', false)

      if (error) throw error
    } catch (error) {
      console.error('Error marking all as read:', error)
      throw error
    }
  },

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  },

  // =============================================
  // IMAGE UPLOAD - WITH FALLBACK
  // =============================================

  async uploadImage(imageUri: string, userId: string): Promise<string> {
    try {
      console.log('📷 Starting image upload...')
      console.log('📷 Image URI:', imageUri)
      
      // 🔥 FOR STUDENT PROJECT - USE FALLBACK WITHOUT REAL UPLOAD
      // This avoids needing to configure Supabase Storage
      console.log('⚠️ Using fallback mode - no actual upload')
      
      // Return the local URI as the "uploaded" URL
      // In production, you would upload to Supabase Storage
      return imageUri
      
      /* ====== REAL UPLOAD CODE (COMMENTED OUT FOR STUDENT PROJECT) ======
      
      // Check if bucket exists
      const { data: buckets, error: bucketError } = await supabase
        .storage
        .listBuckets()
      
      if (bucketError) {
        console.error('❌ Error listing buckets:', bucketError)
        throw new Error('Unable to access storage. Please check your internet connection.')
      }
      
      const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)
      if (!bucketExists) {
        console.error(`❌ "${BUCKET_NAME}" bucket does not exist!`)
        throw new Error(`Storage bucket "${BUCKET_NAME}" not found. Please create it in Supabase.`)
      }

      // Convert image to blob
      const response = await fetch(imageUri)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`)
      }
      
      const blob = await response.blob()
      
      // Generate unique file name
      const fileExt = imageUri.split('.').pop() || 'jpg'
      const fileName = `${userId}/${Date.now()}.${fileExt}`
      const filePath = `${BUCKET_NAME}/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, blob, {
          contentType: blob.type || 'image/jpeg',
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath)

      console.log('🔗 Public URL:', publicUrl)
      return publicUrl
      
      ====== END REAL UPLOAD CODE ====== */
      
    } catch (error: any) {
      console.error('❌ Error uploading image:', error)
      
      let errorMessage = 'Failed to upload image'
      
      if (error.message?.includes('Network request failed')) {
        errorMessage = 'Network error. Please check your internet connection and try again.'
      } else if (error.message?.includes('bucket')) {
        errorMessage = 'Storage bucket not configured. Please create "chat-images" bucket in Supabase.'
      } else if (error.message?.includes('permission')) {
        errorMessage = 'Permission denied. Please login again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      throw new Error(errorMessage)
    }
  },

  // =============================================
  // TEST FUNCTIONS
  // =============================================

  async testStorageConnection(): Promise<boolean> {
    try {
      console.log('🔗 Testing storage connection...')
      const { data, error } = await supabase.storage.listBuckets()
      
      if (error) {
        console.error('❌ Storage connection error:', error)
        return false
      }
      
      const buckets = data?.map(b => b.name) || []
      console.log('✅ Storage connected. Available buckets:', buckets)
      
      const hasChatBucket = buckets.includes(BUCKET_NAME)
      if (hasChatBucket) {
        console.log(`✅ ${BUCKET_NAME} bucket exists`)
      } else {
        console.log(`⚠️ ${BUCKET_NAME} bucket not found - using fallback mode`)
      }
      
      return true
    } catch (error) {
      console.error('❌ Storage test failed:', error)
      return false
    }
  }
}