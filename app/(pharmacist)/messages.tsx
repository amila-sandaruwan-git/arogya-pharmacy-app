import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useChat } from '../../context/ChatContext'
import { useAuth } from '../../context/AuthContext'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../navigation/types'

type PharmacistMessagesNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Messages'>

export default function PharmacistMessages() {
  const { user } = useAuth()
  const { conversations, unreadCount, isLoading, refreshConversations } = useChat()
  const navigation = useNavigation<PharmacistMessagesNavigationProp>()

  useEffect(() => {
    refreshConversations()
  }, [])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  const navigateToChat = (partnerId: string) => {
    navigation.navigate('Chat', { pharmacistId: partnerId } as any)
  }

  const renderConversation = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
      onPress={() => navigateToChat(item.partner_id)}
    >
      <Image
        source={{ uri: item.partner_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.partner_name)}&background=2C7A7B&color=fff&size=40` }}
        style={{ width: 50, height: 50, borderRadius: 25 }}
      />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A202C' }}>
            {item.partner_name}
          </Text>
          <Text style={{ fontSize: 12, color: '#A0AEC0' }}>
            {formatTime(item.created_at)}
          </Text>
        </View>
        <Text 
          style={{ 
            fontSize: 14, 
            color: '#718096',
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {item.message || (item.image_url ? '📷 Image' : '')}
        </Text>
      </View>
      {item.unread_count > 0 && (
        <View style={{
          backgroundColor: '#E53E3E',
          borderRadius: 12,
          minWidth: 24,
          height: 24,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 6,
          marginLeft: 8,
        }}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
            {item.unread_count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2C7A7B" />
        <Text style={{ marginTop: 12, color: '#718096' }}>Loading conversations...</Text>
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
            💬 Messages
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
        <TouchableOpacity onPress={refreshConversations}>
          <Ionicons name="refresh" size={24} color="#2C7A7B" />
        </TouchableOpacity>
      </View>

      {conversations.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="chatbubbles-outline" size={64} color="#CBD5E0" />
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#2D3748', marginTop: 16 }}>
            No messages yet
          </Text>
          <Text style={{ fontSize: 14, color: '#718096', marginTop: 8, textAlign: 'center' }}>
            Messages from customers will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.partner_id}
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshing={isLoading}
          onRefresh={refreshConversations}
        />
      )}
    </SafeAreaView>
  )
}