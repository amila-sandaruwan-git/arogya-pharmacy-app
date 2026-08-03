import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { useNavigation } from '@react-navigation/native'
import type { LoginScreenNavigationProp } from '../../navigation/types'
import { Ionicons } from '@expo/vector-icons'

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [username, setUsername] = useState('')
  const [isNewUser, setIsNewUser] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigation = useNavigation<LoginScreenNavigationProp>()

  const handleSendOTP = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number')
      return
    }

    if (isNewUser && username.length < 3) {
      Alert.alert('Error', 'Please enter a username (min 3 characters)')
      return
    }

    setIsLoading(true)
    try {
      // Store username if new user
      if (isNewUser) {
        // You can store this in AsyncStorage or pass it to next screen
      }
      await login(phoneNumber)
      navigation.navigate('OTPVerification', { phoneNumber })
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}
      >
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          {/* ✅ Logo Image */}
          <Image
            source={require('../../assets/logo.png')}
            style={{
              width: 120,
              height: 120,
              resizeMode: 'contain',
              marginBottom: 8,
            }}
          />
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#2C7A7B' }}>
            Welcome to Arogya
          </Text>
          <Text style={{ fontSize: 14, color: '#718096', marginTop: 8 }}>
            Your trusted pharmacy delivery service
          </Text>
        </View>

        {isNewUser && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#4A5568', marginBottom: 8 }}>
              Choose a Username
            </Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              borderRadius: 12,
              paddingHorizontal: 16,
              backgroundColor: '#F7FAFC',
            }}>
              <Ionicons name="person-outline" size={20} color="#A0AEC0" />
              <TextInput
                style={{ flex: 1, paddingVertical: 14, fontSize: 16, marginLeft: 8 }}
                placeholder="Enter username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          </View>
        )}

        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#4A5568', marginBottom: 8 }}>
            Phone Number
          </Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            borderRadius: 12,
            paddingHorizontal: 16,
            backgroundColor: '#F7FAFC',
          }}>
            <Text style={{ fontSize: 16, color: '#4A5568', marginRight: 8 }}>🇱🇰 +94</Text>
            <TextInput
              style={{ flex: 1, paddingVertical: 14, fontSize: 16 }}
              placeholder="77 123 4567"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={10}
            />
          </View>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: '#2C7A7B',
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            opacity: isLoading ? 0.7 : 1,
          }}
          onPress={handleSendOTP}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              Continue with Phone
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={{ marginTop: 12, alignItems: 'center' }}
          onPress={() => setIsNewUser(!isNewUser)}
        >
          <Text style={{ color: '#2C7A7B', fontSize: 14 }}>
            {isNewUser ? 'Already have an account? Login' : "Don't have an account? Sign up"}
          </Text>
        </TouchableOpacity>

        <Text style={{
          textAlign: 'center',
          color: '#A0AEC0',
          fontSize: 12,
          marginTop: 16,
        }}>
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}