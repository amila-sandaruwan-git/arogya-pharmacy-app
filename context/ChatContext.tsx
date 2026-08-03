import React, { createContext, useState, useContext, useEffect } from 'react'
import { ChatMessage } from '../types'
import { useAuth } from './AuthContext'
import { ChatService } from '../services/chat.service'
import { NotificationService } from '../services/notification.service'
import { supabase } from '../config/supabase'

interface ChatContextType {
  messages: ChatMessage[]
  conversations: any[]
  unreadCount: number
  isLoading: boolean
  sendMessage: (receiverId: string, message: string, imageUrl?: string) => Promise<void>
  sendImage: (receiverId: string, imageUri: string) => Promise<void>
  getConversation: (userId: string) => Promise<ChatMessage[]>
  markAsRead: (messageId: string) => Promise<void>
  markAllAsRead: (partnerId: string) => Promise<void>
  refreshConversations: () => Promise<void>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [channel, setChannel] = useState<any>(null)

  useEffect(() => {
    if (user) {
      loadConversations()
      loadUnreadCount()
      setupRealtimeSubscription()
    }
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  const loadConversations = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const convos = await ChatService.getConversations(user.id)
      setConversations(convos)
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    if (!user) return
    try {
      const count = await ChatService.getUnreadCount(user.id)
      setUnreadCount(count)
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!user) return

    if (channel) {
      supabase.removeChannel(channel)
    }

    const newChannel = supabase
      .channel(`chat_${user.id}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage
          console.log('📩 New message received:', newMessage)
          
          setUnreadCount(prev => prev + 1)
          setMessages(prev => [...prev, newMessage])
          loadConversations()
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status)
      })

    setChannel(newChannel)
  }

  const refreshConversations = async () => {
    await loadConversations()
    await loadUnreadCount()
  }

  const sendMessage = async (receiverId: string, message: string, imageUrl?: string) => {
    if (!user) throw new Error('User not authenticated')
    if (!message.trim() && !imageUrl) return

    try {
      const newMessage = await ChatService.sendMessage({
        senderId: user.id,
        receiverId: receiverId,
        message: message.trim(),
        imageUrl: imageUrl,
      })
      
      // ✅ Create notification for receiver
      await NotificationService.createMessageNotification(
        receiverId,
        user.id,
        user.full_name || user.username || 'User',
        message.trim()
      )
      
      setMessages(prev => [...prev, newMessage])
      await loadConversations()
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  const sendImage = async (receiverId: string, imageUri: string) => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      const imageUrl = await ChatService.uploadImage(imageUri, user.id)
      await sendMessage(receiverId, '📷 Image shared', imageUrl)
    } catch (error) {
      console.error('Error sending image:', error)
      throw error
    }
  }

  const getConversation = async (userId: string): Promise<ChatMessage[]> => {
    if (!user) return []
    try {
      const msgs = await ChatService.getConversation(user.id, userId)
      setMessages(msgs)
      return msgs
    } catch (error) {
      console.error('Error getting conversation:', error)
      return []
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      await ChatService.markAsRead(messageId)
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async (partnerId: string) => {
    if (!user) return
    try {
      await ChatService.markAllAsRead(user.id, partnerId)
      await loadUnreadCount()
      setMessages(prev => 
        prev.map(msg => 
          msg.sender_id === partnerId && msg.receiver_id === user.id
            ? { ...msg, is_read: true }
            : msg
        )
      )
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  return (
    <ChatContext.Provider value={{
      messages,
      conversations,
      unreadCount,
      isLoading,
      sendMessage,
      sendImage,
      getConversation,
      markAsRead,
      markAllAsRead,
      refreshConversations,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}