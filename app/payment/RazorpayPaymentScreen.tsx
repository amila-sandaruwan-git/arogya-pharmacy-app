import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import RazorpayCheckout from 'react-native-razorpay'

interface RazorpayPaymentScreenProps {
  amount: number
  orderId: string
  onSuccess: (paymentId: string) => void
  onCancel: () => void
  userName?: string
  userEmail?: string
  userPhone?: string
}

export default function RazorpayPaymentScreen({
  amount,
  orderId,
  onSuccess,
  onCancel,
  userName = 'Arogya User',
  userEmail = 'user@arogya.com',
  userPhone = '9876543210',
}: RazorpayPaymentScreenProps) {
  const [loading, setLoading] = React.useState(false)

  // 🔥 REPLACE WITH YOUR RAZORPAY KEY FROM DASHBOARD
  // Go to: https://dashboard.razorpay.com → Settings → API Keys
  const RAZORPAY_KEY = 'rzp_test_TKzyvN6hkiDdLv'

  const handlePayment = () => {
    setLoading(true)

    const options = {
      description: 'Medicine Order Payment',
      image: 'https://your-app-icon-url.png',
      currency: 'INR',
      key: RAZORPAY_KEY,
      amount: Math.round(amount * 100), // Amount in paise
      name: 'Arogya Pharmacy',
      order_id: orderId,
      prefill: {
        email: userEmail,
        contact: userPhone,
        name: userName,
      },
      theme: {
        color: '#2C7A7B',
      },
      modal: {
        backdrop: true,
      },
    }

    RazorpayCheckout.open(options)
      .then((data: any) => {
        console.log('✅ Payment Success:', data)
        setLoading(false)
        Alert.alert('Success', 'Payment completed successfully!', [
          { text: 'OK', onPress: () => onSuccess(data.razorpay_payment_id) }
        ])
      })
      .catch((error: any) => {
        console.log('❌ Payment Error:', error)
        setLoading(false)
        if (error.code === 'PAYMENT_ERROR') {
          Alert.alert('Error', 'Payment failed. Please try again.')
        } else if (error.code === 'CANCELLED') {
          Alert.alert('Cancelled', 'Payment was cancelled.')
        } else {
          Alert.alert('Error', error.description || 'Something went wrong.')
        }
      })
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      {/* Header */}
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
          Secure Payment
        </Text>
      </View>

      <View style={{ padding: 20, flex: 1 }}>
        {/* Amount Display */}
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
          <Text style={{ fontSize: 14, color: '#718096' }}>Amount to Pay</Text>
          <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#2C7A7B', marginTop: 4 }}>
            ₹{amount.toFixed(2)}
          </Text>
          <Text style={{ fontSize: 12, color: '#A0AEC0', marginTop: 8 }}>
            Order: {orderId.slice(0, 8)}...
          </Text>
        </View>

        {/* Payment Options Info */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A202C', marginBottom: 12 }}>
            Payment Options
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <View style={{ 
              backgroundColor: '#F0FFF4', 
              paddingHorizontal: 12, 
              paddingVertical: 6, 
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#C6F6D5',
            }}>
              <Text style={{ fontSize: 12, color: '#276749' }}>💳 Cards</Text>
            </View>
            <View style={{ 
              backgroundColor: '#EBF8FF', 
              paddingHorizontal: 12, 
              paddingVertical: 6, 
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#BEE3F8',
            }}>
              <Text style={{ fontSize: 12, color: '#2B6CB0' }}>📱 UPI</Text>
            </View>
            <View style={{ 
              backgroundColor: '#FAF5FF', 
              paddingHorizontal: 12, 
              paddingVertical: 6, 
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#E9D8FD',
            }}>
              <Text style={{ fontSize: 12, color: '#6B46C1' }}>🏦 Net Banking</Text>
            </View>
            <View style={{ 
              backgroundColor: '#FFF5F5', 
              paddingHorizontal: 12, 
              paddingVertical: 6, 
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#FED7D7',
            }}>
              <Text style={{ fontSize: 12, color: '#9B2C2C' }}>💵 Wallets</Text>
            </View>
          </View>
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          style={{
            backgroundColor: loading ? '#A0AEC0' : '#2C7A7B',
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: 'auto',
          }}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              Pay ₹{amount.toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={{
          textAlign: 'center',
          color: '#A0AEC0',
          fontSize: 11,
          marginTop: 12,
        }}>
          🔒 Secured by Razorpay • Test Mode
        </Text>
      </View>
    </SafeAreaView>
  )
}