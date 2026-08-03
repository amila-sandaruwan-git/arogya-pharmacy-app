import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface MockPaymentScreenProps {
  amount: number
  orderId: string
  onSuccess: (paymentId: string) => void
  onCancel: () => void
  userName?: string
  userEmail?: string
  userPhone?: string
}

export default function MockPaymentScreen({
  amount,
  orderId,
  onSuccess,
  onCancel,
  userName = 'Arogya User',
}: MockPaymentScreenProps) {
  const [loading, setLoading] = React.useState(false)
  const [step, setStep] = React.useState<'card' | 'otp' | 'processing' | 'done'>('card')

  const handlePay = () => {
    setStep('otp')
  }

  const handleOTPSubmit = () => {
    setStep('processing')
    setLoading(true)
    
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false)
      setStep('done')
      // Wait a moment before showing success
      setTimeout(() => {
        onSuccess('mock_pay_' + Date.now())
      }, 500)
    }, 2000)
  }

  const handleRetry = () => {
    setStep('card')
  }

  // Card Entry Step
  if (step === 'card') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
        }}>
          <TouchableOpacity onPress={onCancel}>
            <Ionicons name="close" size={24} color="#2D3748" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A202C', marginLeft: 16 }}>
            💳 Card Payment
          </Text>
        </View>

        <View style={{ padding: 20, flex: 1 }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <Text style={{ fontSize: 14, color: '#718096' }}>Amount</Text>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#2C7A7B' }}>
              ₹{amount.toFixed(2)}
            </Text>
          </View>

          <View style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A202C', marginBottom: 16 }}>
              💳 Card Details (Test Mode)
            </Text>
            
            <View style={{
              borderWidth: 1,
              borderColor: '#E2E8F0',
              borderRadius: 8,
              padding: 14,
              marginBottom: 12,
              backgroundColor: '#F7FAFC',
            }}>
              <Text style={{ fontSize: 12, color: '#A0AEC0' }}>Card Number</Text>
              <Text style={{ fontSize: 16, color: '#2D3748' }}>•••• •••• •••• 4242</Text>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{
                flex: 1,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 8,
                padding: 14,
                backgroundColor: '#F7FAFC',
              }}>
                <Text style={{ fontSize: 12, color: '#A0AEC0' }}>Expiry</Text>
                <Text style={{ fontSize: 16, color: '#2D3748' }}>12/26</Text>
              </View>
              <View style={{
                flex: 1,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 8,
                padding: 14,
                backgroundColor: '#F7FAFC',
              }}>
                <Text style={{ fontSize: 12, color: '#A0AEC0' }}>CVV</Text>
                <Text style={{ fontSize: 16, color: '#2D3748' }}>•••</Text>
              </View>
            </View>

            <View style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: '#FEFCBF',
              borderRadius: 8,
            }}>
              <Text style={{ color: '#D69E2E', fontSize: 12, textAlign: 'center' }}>
                🔒 Test Mode • No real money will be charged
              </Text>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#2C7A7B',
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                marginTop: 16,
              }}
              onPress={handlePay}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                Pay ₹{amount.toFixed(2)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  // OTP Verification Step
  if (step === 'otp') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
        }}>
          <TouchableOpacity onPress={() => setStep('card')}>
            <Ionicons name="arrow-back" size={24} color="#2D3748" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A202C', marginLeft: 16 }}>
            🔐 Verify OTP
          </Text>
        </View>

        <View style={{ padding: 20, flex: 1, justifyContent: 'center' }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 30,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#EBF8FF',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons name="shield-checkmark-outline" size={40} color="#2B6CB0" />
            </View>

            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A202C', marginTop: 16 }}>
              Enter OTP
            </Text>
            <Text style={{ fontSize: 14, color: '#718096', marginTop: 8, textAlign: 'center' }}>
              We've sent a 6-digit OTP to your registered phone
            </Text>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 12,
              marginTop: 24,
            }}>
              {[1, 2, 3, 4, 5, 6].map((_, index) => (
                <View key={index} style={{
                  width: 45,
                  height: 55,
                  borderWidth: 2,
                  borderColor: '#2C7A7B',
                  borderRadius: 8,
                  backgroundColor: '#F0FFF4',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 20, fontWeight: '600', color: '#2C7A7B' }}>
                    {index < 4 ? '•' : ''}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: '#FEFCBF',
              borderRadius: 8,
              width: '100%',
            }}>
              <Text style={{ color: '#D69E2E', fontSize: 12, textAlign: 'center' }}>
                📱 For testing, any OTP will work
              </Text>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#2C7A7B',
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                marginTop: 16,
                width: '100%',
              }}
              onPress={handleOTPSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                  Verify & Pay
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 12 }}>
              <Text style={{ color: '#2C7A7B', fontSize: 14 }}>Resend OTP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  // Processing Step
  if (step === 'processing') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2C7A7B" />
          <Text style={{ fontSize: 16, color: '#718096', marginTop: 16 }}>Processing payment...</Text>
          <Text style={{ fontSize: 14, color: '#A0AEC0', marginTop: 8 }}>Please wait</Text>
        </View>
      </SafeAreaView>
    )
  }

  // Done Step - Should not reach here as onSuccess is called
  return null
}