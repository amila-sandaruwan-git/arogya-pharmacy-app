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

export default function PharmacistProfile() {
  const { user, logout, updateUser, uploadAvatar, isLoading, refreshUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        full_name: user.full_name || '',
        email: user.email || '',
      })
      
      // ✅ Check if avatar_url exists and is valid
      if (user.avatar_url && user.avatar_url.startsWith('http')) {
        setAvatarUri(user.avatar_url)
        console.log('📸 Avatar URL from user:', user.avatar_url)
      } else {
        const name = encodeURIComponent(user.full_name || user.username || 'User')
        const fallbackUrl = `https://ui-avatars.com/api/?name=${name}&background=2C7A7B&color=fff&size=200&bold=true`
        setAvatarUri(fallbackUrl)
        console.log('📸 Using fallback avatar:', fallbackUrl)
      }
    }
  }, [user])

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
        </View>
      </SafeAreaView>
    )
  }

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        const { status: newStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (newStatus !== 'granted') {
          Alert.alert('Permission Required', 'Please allow access to your photos')
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
        setIsUploading(true)
        try {
          const avatarUrl = await uploadAvatar(result.assets[0].uri)
          setAvatarUri(avatarUrl)
          await refreshUser()
          Alert.alert('Success', 'Profile picture updated!')
        } catch (error) {
          Alert.alert('Error', 'Failed to upload image')
        } finally {
          setIsUploading(false)
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image')
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#fff',
        }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1A202C' }}>
            Pharmacist Profile
          </Text>
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
            <Image
              source={{ 
                uri: avatarUri || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=2C7A7B&color=fff&size=200&bold=true` 
              }}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 3,
                borderColor: '#2C7A7B',
                backgroundColor: '#EDF2F7',
              }}
              onError={(e) => {
                console.error('❌ Image load error:', e.nativeEvent.error)
                const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=2C7A7B&color=fff&size=200&bold=true`
                setAvatarUri(fallback)
              }}
            />
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
          
          {/* Pharmacist Badge */}
          <View style={{
            backgroundColor: '#2C7A7B',
            paddingHorizontal: 16,
            paddingVertical: 4,
            borderRadius: 12,
            marginTop: 4,
          }}>
            <Text style={{ fontSize: 12, color: '#fff', fontWeight: '600' }}>
              👨‍⚕️ Pharmacist
            </Text>
          </View>
          
          <Text style={{ fontSize: 14, color: '#718096', marginTop: 4 }}>
            {user.phone_number}
          </Text>
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
            marginBottom: 40,
          }}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#E53E3E" />
          <Text style={{ color: '#E53E3E', fontWeight: '600', fontSize: 16, marginLeft: 8 }}>
            Logout
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}