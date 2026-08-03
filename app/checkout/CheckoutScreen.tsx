import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { OrderService } from '../../services/order.service'
import { OrderItemInput } from '../../types'
import MockPaymentScreen from '../payment/MockPaymentScreen'

// Delivery cost per km
const DELIVERY_RATE_PER_KM = 40

export default function CheckoutScreen() {
  const { user } = useAuth()
  const { cartItems, cartTotal, clearCart } = useCart()
  const navigation = useNavigation()
  
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'card'>('cash')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryCharge, setDeliveryCharge] = useState(120)
  const [isProcessing, setIsProcessing] = useState(false)
  const [notes, setNotes] = useState('')
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pendingOrder, setPendingOrder] = useState<any>(null)

  useEffect(() => {
    if (user?.delivery_address) {
      setDeliveryAddress(user.delivery_address)
    }
  }, [user])

  const totalAmount = cartTotal + deliveryCharge

  // Handle Cash Payment
  const handleCashPayment = async () => {
    if (!deliveryAddress.trim()) {
      Alert.alert('Error', 'Please enter a delivery address')
      return
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty')
      return
    }

    if (!user) {
      Alert.alert('Error', 'Please login first')
      return
    }

    setIsProcessing(true)
    try {
      const orderItems: OrderItemInput[] = cartItems.map(item => ({
        product_id: item.product_id,
        product_name: item.product?.name || 'Product',
        quantity: item.quantity,
        price: item.product?.price || 0,
        selected_color: item.selected_color || null,
      }))

      const order = await OrderService.createOrder({
        userId: user.id,
        items: orderItems,
        deliveryAddress: deliveryAddress.trim(),
        paymentMethod: 'cash',
        deliveryCharge,
        notes: notes.trim(),
      })

      await clearCart()
      
      Alert.alert(
        '🎉 Order Placed Successfully!',
        `Your order has been placed.\nDelivery Code: ${order.delivery_code}\nPayment: Cash on Delivery`,
        [
          { 
            text: 'View Order', 
            onPress: () => navigation.navigate('Deliveries' as never)
          },
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Home' as never)
          }
        ]
      )
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to place order')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle Card Payment - Step 1: Create Order, Step 2: Open Payment
  const handleCardPayment = async () => {
    if (!deliveryAddress.trim()) {
      Alert.alert('Error', 'Please enter a delivery address')
      return
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty')
      return
    }

    if (!user) {
      Alert.alert('Error', 'Please login first')
      return
    }

    setIsProcessing(true)
    try {
      const orderItems: OrderItemInput[] = cartItems.map(item => ({
        product_id: item.product_id,
        product_name: item.product?.name || 'Product',
        quantity: item.quantity,
        price: item.product?.price || 0,
        selected_color: item.selected_color || null,
      }))

      const order = await OrderService.createOrder({
        userId: user.id,
        items: orderItems,
        deliveryAddress: deliveryAddress.trim(),
        paymentMethod: 'card',
        deliveryCharge,
        notes: notes.trim(),
      })

      console.log('✅ Order created for card payment:', order.id)
      
      setPendingOrder(order)
      setShowPaymentModal(true)
      
    } catch (error: any) {
      console.error('❌ Order creation error:', error)
      Alert.alert('Error', error?.message || 'Failed to create order')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle Payment Success
  const handlePaymentSuccess = async (paymentId: string) => {
    setShowPaymentModal(false)
    
    try {
      await OrderService.updateOrderPaymentStatus(pendingOrder.id, 'paid', paymentId)
      await clearCart()
      
      Alert.alert(
        '🎉 Payment Successful!',
        `Your order has been placed and payment confirmed.\nDelivery Code: ${pendingOrder.delivery_code}\nPayment: Card`,
        [
          { 
            text: 'View Order', 
            onPress: () => navigation.navigate('Deliveries' as never)
          },
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Home' as never)
          }
        ]
      )
    } catch (error) {
      console.error('❌ Payment update error:', error)
      Alert.alert('Error', 'Payment was successful but order update failed. Please contact support.')
    }
  }

  // Handle Payment Cancel
  const handlePaymentCancel = () => {
    setShowPaymentModal(false)
    Alert.alert(
      'Payment Cancelled',
      'Your order has been saved but payment is pending. You can complete payment later.',
      [
        { 
          text: 'View Order', 
          onPress: () => navigation.navigate('Deliveries' as never)
        },
        { text: 'OK' }
      ]
    )
  }

  const handlePlaceOrder = () => {
    if (selectedPayment === 'cash') {
      handleCashPayment()
    } else {
      handleCardPayment()
    }
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC', justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="cart-outline" size={64} color="#CBD5E0" />
        <Text style={{ fontSize: 18, color: '#718096', marginTop: 16 }}>Your cart is empty</Text>
        <TouchableOpacity 
          style={{ marginTop: 16, backgroundColor: '#2C7A7B', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
          onPress={() => navigation.navigate('Home' as never)}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Continue Shopping</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Delivery Address */}
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A202C' }}>📍 Delivery Address</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Profile' as never)}>
              <Text style={{ color: '#2C7A7B', fontSize: 12 }}>Edit</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#E2E8F0',
              borderRadius: 8,
              padding: 12,
              fontSize: 14,
              marginTop: 8,
              backgroundColor: '#F7FAFC',
              minHeight: 60,
              textAlignVertical: 'top',
            }}
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            placeholder="Enter your delivery address"
            multiline
          />
          
        </View>

        {/* Delivery Charge */}
        <View style={{
          backgroundColor: '#fff',
          marginHorizontal: 16,
          marginTop: 12,
          padding: 16,
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A202C', marginBottom: 8 }}>
            🚚 Delivery Details
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
            <Text style={{ fontSize: 14, color: '#4A5568' }}>Delivery Charge</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#2C7A7B' }}>Rs {deliveryCharge}.00</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>
            * Standard delivery rate applies
          </Text>
        </View>

        {/* Order Summary */}
        <View style={{
          backgroundColor: '#fff',
          marginHorizontal: 16,
          marginTop: 12,
          padding: 16,
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A202C', marginBottom: 8 }}>
            📋 Order Summary
          </Text>
          {cartItems.map((item) => (
            <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
              <Text style={{ fontSize: 14, color: '#4A5568' }}>
                {item.quantity}x {item.product?.name}
              </Text>
              <Text style={{ fontSize: 14, color: '#2D3748' }}>
                Rs {(item.product?.price || 0) * item.quantity}.00
              </Text>
            </View>
          ))}
          <View style={{ borderTopWidth: 1, borderTopColor: '#E2E8F0', marginTop: 8, paddingTop: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, color: '#4A5568' }}>Subtotal</Text>
              <Text style={{ fontSize: 14, color: '#2D3748' }}>Rs {cartTotal}.00</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={{ fontSize: 14, color: '#4A5568' }}>Delivery</Text>
              <Text style={{ fontSize: 14, color: '#2D3748' }}>Rs {deliveryCharge}.00</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1A202C' }}>Total</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2C7A7B' }}>Rs {totalAmount}.00</Text>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={{
          backgroundColor: '#fff',
          marginHorizontal: 16,
          marginTop: 12,
          padding: 16,
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A202C', marginBottom: 12 }}>
            💳 Payment Method
          </Text>
          
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: selectedPayment === 'cash' ? '#2C7A7B' : '#E2E8F0',
              backgroundColor: selectedPayment === 'cash' ? '#F0FFF4' : '#fff',
              marginBottom: 8,
            }}
            onPress={() => setSelectedPayment('cash')}
          >
            <View style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: selectedPayment === 'cash' ? '#2C7A7B' : '#E2E8F0',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              {selectedPayment === 'cash' && (
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#2C7A7B' }} />
              )}
            </View>
            <Ionicons name="cash-outline" size={24} color="#2C7A7B" style={{ marginLeft: 12 }} />
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#2D3748', marginLeft: 8 }}>Cash on Delivery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: selectedPayment === 'card' ? '#2C7A7B' : '#E2E8F0',
              backgroundColor: selectedPayment === 'card' ? '#F0FFF4' : '#fff',
            }}
            onPress={() => setSelectedPayment('card')}
          >
            <View style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: selectedPayment === 'card' ? '#2C7A7B' : '#E2E8F0',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              {selectedPayment === 'card' && (
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#2C7A7B' }} />
              )}
            </View>
            <Ionicons name="card-outline" size={24} color="#2C7A7B" style={{ marginLeft: 12 }} />
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#2D3748', marginLeft: 8 }}>Card Payment</Text>
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <View style={{
          backgroundColor: '#fff',
          marginHorizontal: 16,
          marginTop: 12,
          padding: 16,
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A202C', marginBottom: 8 }}>
            📝 Order Notes (Optional)
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#E2E8F0',
              borderRadius: 8,
              padding: 12,
              fontSize: 14,
              backgroundColor: '#F7FAFC',
              minHeight: 60,
              textAlignVertical: 'top',
            }}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any special instructions..."
            multiline
          />
        </View>

        {/* Place Order Button */}
        <TouchableOpacity
          style={{
            backgroundColor: isProcessing ? '#A0AEC0' : '#2C7A7B',
            marginHorizontal: 16,
            marginTop: 16,
            marginBottom: 40,
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
          }}
          onPress={handlePlaceOrder}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              {selectedPayment === 'cash' ? 'Place Order' : `Pay Rs ${totalAmount}.00/=`}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={false}
        onRequestClose={handlePaymentCancel}
      >
        {pendingOrder && (
          <MockPaymentScreen
            amount={totalAmount}
            orderId={pendingOrder.id}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
            userName={user?.full_name || user?.username || 'Arogya User'}
            userEmail={user?.email || 'user@arogya.com'}
            userPhone={user?.phone_number || '9876543210'}
          />
        )}
      </Modal>
    </SafeAreaView>
  )
}