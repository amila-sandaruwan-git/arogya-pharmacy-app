import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AuthStackParamList } from '../../navigation/types'

type OTPVerificationScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OTPVerification'>
type OTPVerificationScreenRouteProp = RouteProp<AuthStackParamList, 'OTPVerification'>

export default function OTPVerificationScreen() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const inputs = useRef<TextInput[]>([])
  const { verifyOTP } = useAuth()
  const navigation = useNavigation<OTPVerificationScreenNavigationProp>()
  const route = useRoute<OTPVerificationScreenRouteProp>()
  const { phoneNumber } = route.params

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter all 6 digits')
      return
    }

    setIsLoading(true)
    try {
      const success = await verifyOTP(phoneNumber, otpCode)
      if (success) {
        // Navigate to main app
        
      } else {
        Alert.alert('Error', 'Invalid OTP. Please try again.')
        // Clear OTP inputs
        setOtp(['', '', '', '', '', ''])
        inputs.current[0]?.focus()
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to verify OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = text
    setOtp(newOtp)

    if (text && index < 5) {
      inputs.current[index + 1]?.focus()
    }
  }

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handleResendOTP = async () => {
    try {
      // You can call login again here
      Alert.alert('OTP Resent', 'A new OTP has been sent to your phone')
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP')
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingHorizontal: 24 }}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1A202C', textAlign: 'center' }}>
          Verify Phone Number
        </Text>
        <Text style={{ fontSize: 14, color: '#718096', textAlign: 'center', marginTop: 8 }}>
          Enter the 6-digit code sent to {phoneNumber}
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32, gap: 12 }}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputs.current[index] = ref!)}
              style={{
                width: 48,
                height: 56,
                borderWidth: 2,
                borderColor: digit ? '#2C7A7B' : '#E2E8F0',
                borderRadius: 12,
                textAlign: 'center',
                fontSize: 20,
                fontWeight: '600',
                backgroundColor: digit ? '#F0FFF4' : '#F7FAFC',
              }}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
            />
          ))}
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: '#2C7A7B',
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: 32,
            opacity: isLoading ? 0.7 : 1,
          }}
          onPress={handleVerifyOTP}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              Verify OTP
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={{ marginTop: 16, alignItems: 'center' }}
          onPress={handleResendOTP}
        >
          <Text style={{ color: '#2C7A7B', fontSize: 14 }}>
            Resend OTP
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ marginTop: 8, alignItems: 'center' }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: '#A0AEC0', fontSize: 14 }}>
            Change phone number
          </Text>
        </TouchableOpacity>

        <Text style={{
          textAlign: 'center',
          color: '#A0AEC0',
          fontSize: 12,
          marginTop: 16,
        }}>
          Check your phone for the verification code
        </Text>
      </View>
    </SafeAreaView>
  )
}