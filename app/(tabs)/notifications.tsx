import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../context/AuthContext'
import { NotificationService } from '../../services/notification.service'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../navigation/types'
import { supabase } from '../../config/supabase'

type NotificationsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Notifications'>

export default function NotificationsScreen() {
  const { user } = useAuth()
  const navigation = useNavigation<NotificationsScreenNavigationProp>()
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    loadNotifications()
    setupRealtimeSubscription()

    return () => {
      if (channelRef.current) {
        console.log('🧹 Cleaning up notification subscription')
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [])

  const loadNotifications = async () => {
    if (!user) return
    try {
      const data = await NotificationService.getNotifications(user.id)
      setNotifications(data)
      
      const count = await NotificationService.getUnreadCount(user.id)
      setUnreadCount(count)
      
      await NotificationService.markAllAsRead(user.id)
      setUnreadCount(0)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!user) return

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    console.log('📡 Setting up notification subscription for user:', user.id)

    const channel = supabase
      .channel(`notifications_${user.id}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 New notification received:', payload)
          setNotifications(prev => [payload.new, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe((status) => {
        console.log('📡 Notification subscription status:', status)
      })

    channelRef.current = channel
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadNotifications()
    setRefreshing(false)
  }

  const handleDeleteNotification = (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await NotificationService.deleteNotification(notificationId)
              setNotifications(prev => prev.filter(n => n.id !== notificationId))
              if (unreadCount > 0) {
                const count = await NotificationService.getUnreadCount(user!.id)
                setUnreadCount(count)
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete notification')
            }
          }
        }
      ]
    )
  }

  const handleDeleteAll = () => {
    Alert.alert(
      'Delete All Notifications',
      'Are you sure you want to delete all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await NotificationService.deleteAllNotifications(user!.id)
              setNotifications([])
              setUnreadCount(0)
            } catch (error) {
              Alert.alert('Error', 'Failed to delete notifications')
            }
          }
        }
      ]
    )
  }

  const handleDeleteRead = () => {
    const readCount = notifications.filter(n => n.is_read).length
    if (readCount === 0) {
      Alert.alert('Info', 'No read notifications to delete')
      return
    }

    Alert.alert(
      'Delete Read Notifications',
      `Delete ${readCount} read notification(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await NotificationService.deleteAllReadNotifications(user!.id)
              setNotifications(prev => prev.filter(n => !n.is_read))
            } catch (error) {
              Alert.alert('Error', 'Failed to delete read notifications')
            }
          }
        }
      ]
    )
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return 'cube-outline'
      case 'message':
        return 'chatbubble-outline'
      case 'delivery':
        return 'key-outline'
      default:
        return 'notifications-outline'
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'order':
        return '#2C7A7B'
      case 'message':
        return '#4299E1'
      case 'delivery':
        return '#ED8936'
      default:
        return '#718096'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  const handleNotificationPress = (item: any) => {
    if (!item.is_read) {
      NotificationService.markAsRead(item.id)
      setUnreadCount(prev => Math.max(0, prev - 1))
      setNotifications(prev => 
        prev.map(n => n.id === item.id ? { ...n, is_read: true } : n)
      )
    }

    if (item.type === 'order' && item.data?.orderId) {
      // ✅ Fixed navigation
      navigation.navigate('Deliveries')
    } else if (item.type === 'message' && item.data?.senderId) {
      // ✅ Fixed navigation with as any
      navigation.navigate('Chat', { pharmacistId: item.data.senderId } as any)
    }
  }

  const renderNotification = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={{
        backgroundColor: item.is_read ? '#fff' : '#F0FFF4',
        padding: 16,
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: getColor(item.type),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: getColor(item.type) + '20',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}>
          <Ionicons name={getIcon(item.type)} size={20} color={getColor(item.type)} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A202C' }}>
            {item.title}
          </Text>
          <Text style={{ fontSize: 13, color: '#4A5568', marginTop: 2 }}>
            {item.body}
          </Text>
          <Text style={{ fontSize: 11, color: '#A0AEC0', marginTop: 4 }}>
            {formatTime(item.created_at)}
          </Text>
        </View>
        {!item.is_read && (
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#2C7A7B',
            marginLeft: 8,
          }} />
        )}
        <TouchableOpacity
          style={{
            padding: 8,
            marginLeft: 4,
          }}
          onPress={() => handleDeleteNotification(item.id)}
        >
          <Ionicons name="close-circle" size={20} color="#A0AEC0" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2C7A7B" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1A202C' }}>
            🔔 Notifications
          </Text>
          {unreadCount > 0 && (
            <View style={{
              backgroundColor: '#E53E3E',
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 2,
              marginLeft: 8,
            }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
                {unreadCount} new
              </Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity 
            onPress={handleDeleteRead}
            style={{ padding: 4 }}
          >
            <Ionicons name="checkmark-done-circle-outline" size={24} color="#2C7A7B" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleDeleteAll}
            style={{ padding: 4 }}
          >
            <Ionicons name="trash-outline" size={24} color="#E53E3E" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={loadNotifications}
            style={{ padding: 4 }}
          >
            <Ionicons name="refresh" size={24} color="#2C7A7B" />
          </TouchableOpacity>
        </View>
      </View>

      {notifications.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="notifications-off-outline" size={64} color="#CBD5E0" />
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#2D3748', marginTop: 16 }}>
            No notifications
          </Text>
          <Text style={{ fontSize: 14, color: '#718096', marginTop: 8, textAlign: 'center' }}>
            You'll see notifications here when your order status changes or you receive messages
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </SafeAreaView>
  )
}