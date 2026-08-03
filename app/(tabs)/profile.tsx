import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../../context/AuthContext'
import { useOrders } from '../../context/OrderContext'
import { supabase } from '../../config/supabase'

export default function ProfileScreen() {
  const { user, logout, updateUser, uploadAvatar, isLoading, refreshUser } = useAuth()
  const { orders, orderHistory, activeOrders, refreshOrders } = useOrders()
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    delivery_address: '',
  })

  // ✅ Log orders for debugging
  useEffect(() => {
    console.log('📊 Profile - Orders:', orders.length)
    console.log('📊 Profile - Order History:', orderHistory.length)
    console.log('📊 Profile - Active Orders:', activeOrders.length)
  }, [orders, orderHistory, activeOrders])

  // ✅ Refresh orders when screen loads
  useEffect(() => {
    refreshOrders()
  }, [])

  // ✅ Calculate stats
  const totalOrders = orders.length || 0
  const deliveredOrders = orderHistory.filter(o => o.order_status === 'delivered').length || 0
  const activeOrdersCount = activeOrders.length || 0

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        full_name: user.full_name || '',
        email: user.email || '',
        delivery_address: user.delivery_address || '',
      })
      
      loadAvatarFromUser()
    }
  }, [user])

  const loadAvatarFromUser = () => {
    if (user) {
      console.log('📸 User avatar_url from context:', user.avatar_url)
      
      if (user.avatar_url && user.avatar_url.startsWith('http')) {
        setAvatarUri(user.avatar_url)
        setImageError(false)
        console.log('✅ Setting avatar from user.avatar_url:', user.avatar_url)
      } else {
        const name = encodeURIComponent(user.full_name || user.username || 'User')
        const fallbackUrl = `https://ui-avatars.com/api/?name=${name}&background=2C7A7B&color=fff&size=200&bold=true`
        setAvatarUri(fallbackUrl)
        setImageError(false)
        console.log('📸 Using fallback avatar:', fallbackUrl)
      }
    }
  }

  const fetchLatestUserData = async () => {
    if (!user) return
    
    try {
      console.log('🔄 Fetching latest user data from Supabase...')
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.error('❌ Error fetching latest user:', error)
        return
      }
      
      if (data) {
        console.log('✅ Latest user data:', {
          id: data.id,
          username: data.username,
          avatar_url: data.avatar_url || 'No avatar'
        })
        
        if (data.avatar_url && data.avatar_url.startsWith('http')) {
          setAvatarUri(data.avatar_url)
          setImageError(false)
          console.log('✅ Set avatar from Supabase:', data.avatar_url)
        } else {
          const name = encodeURIComponent(data.full_name || data.username || 'User')
          const fallbackUrl = `https://ui-avatars.com/api/?name=${name}&background=2C7A7B&color=fff&size=200&bold=true`
          setAvatarUri(fallbackUrl)
          setImageError(false)
        }
      }
    } catch (error) {
      console.error('❌ Error fetching user:', error)
    }
  }

  useEffect(() => {
    fetchLatestUserData()
  }, [])

  useEffect(() => {
    requestPermissions()
  }, [])

  const requestPermissions = async () => {
    try {
      if (Platform.OS !== 'web') {
        await ImagePicker.requestCameraPermissionsAsync()
        await ImagePicker.requestMediaLibraryPermissionsAsync()
      }
    } catch (error) {
      console.error('Permission error:', error)
    }
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2C7A7B" />
      </View>
    )
  }

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="person-outline" size={64} color="#CBD5E0" />
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#2D3748', marginTop: 16 }}>
            Not Logged In
          </Text>
          <Text style={{ fontSize: 14, color: '#718096', marginTop: 8, textAlign: 'center' }}>
            Please login to access your profile
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  const handleImagePick = async () => {
    try {
      console.log('📷 Starting image pick...')

      const { status: libraryStatus } = await ImagePicker.getMediaLibraryPermissionsAsync()
      
      if (libraryStatus !== 'granted') {
        const { status: newStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (newStatus !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please allow access to your photos to upload profile pictures.',
            [{ text: 'Cancel', style: 'cancel' }]
          )
          return
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri
        console.log('📷 Image URI:', imageUri)
        
        setIsUploading(true)
        try {
          const avatarUrl = await uploadAvatar(imageUri)
          console.log('✅ Avatar uploaded:', avatarUrl)
          setAvatarUri(avatarUrl)
          setImageError(false)
          await fetchLatestUserData()
          Alert.alert('Success', 'Profile picture updated!')
        } catch (uploadError) {
          console.error('❌ Upload error:', uploadError)
          Alert.alert('Error', 'Failed to upload image. Please try again.')
        } finally {
          setIsUploading(false)
        }
      }
    } catch (error) {
      console.error('❌ Image pick error:', error)
      Alert.alert('Error', 'Failed to pick image. Please try again.')
    }
  }

  const handleUpdate = async () => {
    try {
      await updateUser(formData)
      setIsEditing(false)
      Alert.alert('Success', 'Profile updated successfully!')
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile')
    }
  }

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    )
  }

  const StatsCard = ({ icon, label, value, color = '#2C7A7B' }: { icon: string, label: string, value: number | string, color?: string }) => (
    <View style={{
      flex: 1,
      backgroundColor: '#fff',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginHorizontal: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    }}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1A202C', marginTop: 4 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 12, color: '#718096' }}>{label}</Text>
    </View>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Edit Button */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#fff',
        }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1A202C' }}>
            My Profile
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={fetchLatestUserData}>
              <Ionicons name="refresh" size={20} color="#2C7A7B" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: isEditing ? '#E53E3E' : '#2C7A7B',
              }}
            >
              <Ionicons 
                name={isEditing ? 'close' : 'pencil'} 
                size={16} 
                color="#fff" 
              />
              <Text style={{ color: '#fff', marginLeft: 4, fontSize: 12, fontWeight: '600' }}>
                {isEditing ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Image */}
        <View style={{
          alignItems: 'center',
          backgroundColor: '#fff',
          paddingVertical: 24,
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
        }}>
          <TouchableOpacity
            onPress={handleImagePick}
            disabled={isUploading}
            style={{ position: 'relative' }}
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  borderWidth: 3,
                  borderColor: '#2C7A7B',
                  backgroundColor: '#EDF2F7',
                }}
                onError={() => {
                  console.log('❌ Image load error - using fallback')
                  setImageError(true)
                  const name = encodeURIComponent(user.full_name || user.username || 'User')
                  const fallbackUrl = `https://ui-avatars.com/api/?name=${name}&background=2C7A7B&color=fff&size=200&bold=true`
                  setAvatarUri(fallbackUrl)
                }}
              />
            ) : (
              <View style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: '#2C7A7B',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 3,
                borderColor: '#2C7A7B',
              }}>
                <Text style={{
                  fontSize: 40,
                  fontWeight: 'bold',
                  color: '#fff',
                }}>
                  {user.full_name?.[0] || user.username?.[0] || 'U'}
                </Text>
              </View>
            )}
            {isUploading ? (
              <View style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                backgroundColor: '#2C7A7B',
                width: 36,
                height: 36,
                borderRadius: 18,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#fff',
              }}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <View style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                backgroundColor: '#2C7A7B',
                width: 36,
                height: 36,
                borderRadius: 18,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#fff',
              }}>
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1A202C', marginTop: 12 }}>
            {user.full_name || user.username}
          </Text>
          <Text style={{ fontSize: 14, color: '#718096' }}>
            {user.phone_number}
          </Text>
          {user.is_pharmacist && (
            <View style={{
              backgroundColor: '#FEFCBF',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
              marginTop: 4,
            }}>
              <Text style={{ fontSize: 12, color: '#D69E2E', fontWeight: '600' }}>
                Pharmacist
              </Text>
            </View>
          )}
        </View>

        {/* ✅ Stats - Fixed with correct counts */}
        <View style={{
          flexDirection: 'row',
          paddingHorizontal: 16,
          marginTop: 16,
          gap: 8,
        }}>
          <StatsCard 
            icon="cube-outline" 
            label="Total Orders" 
            value={totalOrders} 
          />
          <StatsCard 
            icon="checkmark-circle-outline" 
            label="Delivered" 
            value={deliveredOrders} 
            color="#276749"
          />
          <StatsCard 
            icon="time-outline" 
            label="Active" 
            value={activeOrdersCount} 
            color="#ED8936"
          />
        </View>

        {/* Profile Form */}
        <View style={{
          backgroundColor: '#fff',
          marginHorizontal: 16,
          marginTop: 16,
          padding: 16,
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A202C', marginBottom: 16 }}>
            Personal Information
          </Text>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#4A5568', marginBottom: 4 }}>
              Username
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: isEditing ? '#2C7A7B' : '#E2E8F0',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                backgroundColor: isEditing ? '#fff' : '#F7FAFC',
                color: '#2D3748',
              }}
              value={formData.username}
              onChangeText={(text) => setFormData({ ...formData, username: text })}
              editable={isEditing}
              placeholder="Enter username"
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#4A5568', marginBottom: 4 }}>
              Full Name
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: isEditing ? '#2C7A7B' : '#E2E8F0',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                backgroundColor: isEditing ? '#fff' : '#F7FAFC',
                color: '#2D3748',
              }}
              value={formData.full_name}
              onChangeText={(text) => setFormData({ ...formData, full_name: text })}
              editable={isEditing}
              placeholder="Enter full name"
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#4A5568', marginBottom: 4 }}>
              Email
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: isEditing ? '#2C7A7B' : '#E2E8F0',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                backgroundColor: isEditing ? '#fff' : '#F7FAFC',
                color: '#2D3748',
              }}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              editable={isEditing}
              placeholder="Enter email"
              keyboardType="email-address"
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#4A5568', marginBottom: 4 }}>
              Delivery Address
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: isEditing ? '#2C7A7B' : '#E2E8F0',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                backgroundColor: isEditing ? '#fff' : '#F7FAFC',
                color: '#2D3748',
                minHeight: 80,
                textAlignVertical: 'top',
              }}
              value={formData.delivery_address}
              onChangeText={(text) => setFormData({ ...formData, delivery_address: text })}
              editable={isEditing}
              placeholder="Enter delivery address"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#4A5568', marginBottom: 4 }}>
              Phone Number
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                backgroundColor: '#F7FAFC',
                color: '#A0AEC0',
              }}
              value={user.phone_number}
              editable={false}
            />
          </View>

          {isEditing && (
            <TouchableOpacity
              style={{
                backgroundColor: '#2C7A7B',
                paddingVertical: 14,
                borderRadius: 8,
                alignItems: 'center',
                marginTop: 8,
              }}
              onPress={handleUpdate}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                Save Changes
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={{
            backgroundColor: '#FFF5F5',
            marginHorizontal: 16,
            marginTop: 16,
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#FED7D7',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#E53E3E" />
          <Text style={{ color: '#E53E3E', fontWeight: '600', fontSize: 16, marginLeft: 8 }}>
            Logout
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}