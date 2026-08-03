import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Linking,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../../context/AuthContext'
import { useChat } from '../../context/ChatContext'
import { supabase } from '../../config/supabase'
import { useRoute, useNavigation } from '@react-navigation/native'

export default function ChatScreen() {
  const { user } = useAuth()
  const { messages, sendMessage, sendImage, markAllAsRead, getConversation, isLoading } = useChat()
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [partnerName, setPartnerName] = useState<string>('Pharmacist')
  const [partnerPhone, setPartnerPhone] = useState<string>('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isImageModalVisible, setIsImageModalVisible] = useState(false)
  const flatListRef = useRef<FlatList>(null)
  const route = useRoute()
  const navigation = useNavigation()
  
  // Get pharmacist ID from route params
  const routePharmacistId = (route.params as any)?.pharmacistId || null

  useEffect(() => {
    const getPharmacist = async () => {
      if (routePharmacistId) {
        setPartnerId(routePharmacistId)
        const { data, error } = await supabase
          .from('users')
          .select('username, full_name, phone_number')
          .eq('id', routePharmacistId)
          .single()
        if (data) {
          setPartnerName(data.full_name || data.username || 'Pharmacist')
          setPartnerPhone(data.phone_number || '')
        }
        return
      }
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, full_name, phone_number')
          .eq('is_pharmacist', true)
          .limit(1)
          .single()
        
        if (error) {
          console.error('Error fetching pharmacist:', error)
          return
        }
        
        if (data) {
          setPartnerId(data.id)
          setPartnerName(data.full_name || data.username || 'Pharmacist')
          setPartnerPhone(data.phone_number || '')
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }
    
    getPharmacist()
  }, [routePharmacistId])

  useEffect(() => {
    if (partnerId && user) {
      getConversation(partnerId)
      markAllAsRead(partnerId)
    }
  }, [partnerId])

  const sendMessageHandler = async () => {
    if (!inputText.trim() || !partnerId || isSending) return
    
    setIsSending(true)
    try {
      // Send message - this will update instantly via context
      await sendMessage(partnerId, inputText.trim())
      setInputText('')
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 50)
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos to share images.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
        base64: false,
      })

      if (!result.canceled && result.assets && result.assets.length > 0 && partnerId) {
        const imageUri = result.assets[0].uri
        console.log('📷 Image selected:', imageUri)
        
        setIsSending(true)
        try {
          // Send image - this will update instantly via context
          await sendImage(partnerId, imageUri)
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true })
          }, 50)
        } catch (error: any) {
          console.error('❌ Send image error:', error)
          Alert.alert('Error', error?.message || 'Failed to send image. Please try again.')
        } finally {
          setIsSending(false)
        }
      }
    } catch (error: any) {
      console.error('❌ Pick image error:', error)
      Alert.alert('Error', error?.message || 'Failed to pick image')
    }
  }

  const handleCallPress = () => {
    if (partnerPhone) {
      let phoneNumber = partnerPhone.replace(/[^0-9+]/g, '')
      Linking.openURL(`tel:${phoneNumber}`).catch(() => {
        Alert.alert('Error', 'Unable to make call. Please dial manually.')
      })
    } else {
      Alert.alert('Info', 'Pharmacist phone number not available.')
    }
  }

  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    setIsImageModalVisible(true)
  }

  const renderMessage = ({ item }: { item: any }) => {
    const isUser = item.sender_id === user?.id
    
    const hasImage = item.image_url && item.image_url.length > 0
    const hasText = item.message && item.message.length > 0
    
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          if (hasImage) {
            handleImagePress(item.image_url)
          }
        }}
        style={{
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          backgroundColor: isUser ? '#2C7A7B' : '#fff',
          padding: hasImage ? 8 : 12,
          paddingHorizontal: 12,
          borderRadius: 12,
          marginHorizontal: 16,
          marginVertical: 4,
          maxWidth: '80%',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
          borderWidth: isUser ? 0 : 1,
          borderColor: '#E2E8F0',
        }}
      >
        {hasImage && (
          <Image
            source={{ uri: item.image_url }}
            style={{
              width: 200,
              height: 200,
              borderRadius: 8,
              marginBottom: hasText ? 8 : 0,
            }}
            resizeMode="cover"
          />
        )}
        {hasText && (
          <Text style={{
            color: isUser ? '#fff' : '#2D3748',
            fontSize: 14,
            lineHeight: 20,
          }}>
            {item.message === '📷 Image shared' && hasImage ? '📷 Image shared' : item.message}
          </Text>
        )}
        <Text style={{
          fontSize: 10,
          color: isUser ? 'rgba(255,255,255,0.7)' : '#A0AEC0',
          marginTop: 4,
          alignSelf: 'flex-end',
        }}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {isUser && (
            <Text style={{ marginLeft: 4 }}>
              {item.is_read ? ' ✓✓' : ' ✓'}
            </Text>
          )}
        </Text>
      </TouchableOpacity>
    )
  }

  if (!partnerId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2C7A7B" />
        <Text style={{ marginTop: 12, color: '#718096' }}>Connecting to pharmacist...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      {/* ✅ Header - Minimal, no white space */}
      <View style={{
        height: 0,  // ✅ Completely remove header
      }} />

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List - No loading state, instant updates */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16, paddingBottom: 80 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="chatbubbles-outline" size={48} color="#CBD5E0" />
              <Text style={{ fontSize: 16, color: '#A0AEC0', marginTop: 8 }}>
                No messages yet
              </Text>
              <Text style={{ fontSize: 14, color: '#CBD5E0' }}>
                Start chatting with your pharmacist
              </Text>
            </View>
          }
        />

        {/* Input Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 8,
          paddingVertical: 8,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
        }}>
          {/* Call Button */}
          <TouchableOpacity 
            style={{ 
              padding: 10,
              borderRadius: 20,
              backgroundColor: '#F0FFF4',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 6,
            }}
            onPress={handleCallPress}
          >
            <Ionicons name="call-outline" size={22} color="#2C7A7B" />
          </TouchableOpacity>

          {/* Image Upload Button */}
          <TouchableOpacity 
            style={{ 
              padding: 10,
              borderRadius: 20,
              backgroundColor: isSending ? '#EDF2F7' : '#F0FFF4',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 6,
            }}
            onPress={pickImage}
            disabled={isSending}
          >
            <Ionicons name="image-outline" size={22} color={isSending ? '#A0AEC0' : '#2C7A7B'} />
          </TouchableOpacity>

          {/* Text Input with Send Button Inside */}
          <View style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            borderRadius: 20,
            backgroundColor: '#F7FAFC',
            paddingHorizontal: 12,
            paddingVertical: Platform.OS === 'ios' ? 4 : 2,
          }}>
            <TextInput
              style={{
                flex: 1,
                fontSize: 14,
                paddingVertical: Platform.OS === 'ios' ? 6 : 4,
                maxHeight: 100,
                minHeight: 32,
                color: '#2D3748',
              }}
              placeholder="Type a message..."
              placeholderTextColor="#A0AEC0"
              value={inputText}
              onChangeText={setInputText}
              editable={!isSending}
              multiline
            />
            
            {/* Send Button */}
            <TouchableOpacity
              style={{
                backgroundColor: (inputText.trim() && !isSending) ? '#2C7A7B' : '#E2E8F0',
                padding: 6,
                borderRadius: 20,
                marginLeft: 4,
                justifyContent: 'center',
                alignItems: 'center',
                width: 30,
                height: 30,
              }}
              onPress={sendMessageHandler}
              disabled={!inputText.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons 
                  name="send" 
                  size={16} 
                  color={inputText.trim() ? '#fff' : '#A0AEC0'} 
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Full Screen Image Modal */}
      <Modal
        visible={isImageModalVisible}
        transparent={true}
        onRequestClose={() => setIsImageModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.95)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 40,
              right: 20,
              zIndex: 10,
              backgroundColor: 'rgba(255,255,255,0.3)',
              borderRadius: 20,
              padding: 8,
            }}
            onPress={() => setIsImageModalVisible(false)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={{
                width: '100%',
                height: '80%',
                resizeMode: 'contain',
              }}
              resizeMode="contain"
            />
          )}
          
          <TouchableOpacity
            style={{
              position: 'absolute',
              bottom: 40,
              backgroundColor: 'rgba(255,255,255,0.2)',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 20,
            }}
            onPress={() => setIsImageModalVisible(false)}
          >
            <Text style={{ color: '#fff', fontSize: 14 }}>Tap to close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  )
}