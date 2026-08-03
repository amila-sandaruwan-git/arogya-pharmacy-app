import React, { useState } from 'react'
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../navigation/types'

type CartScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Cart'>

export default function CartScreen() {
  const { user } = useAuth()
  const { cartItems, cartTotal, cartCount, removeFromCart, updateQuantity, isLoading } = useCart()
  const navigation = useNavigation<CartScreenNavigationProp>()
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null)

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="cart-outline" size={64} color="#CBD5E0" />
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#2D3748', marginTop: 16 }}>
            Your cart is empty
          </Text>
          <Text style={{ fontSize: 14, color: '#718096', marginTop: 8, textAlign: 'center' }}>
            Please login to view your cart items
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#2C7A7B',
              paddingHorizontal: 32,
              paddingVertical: 12,
              borderRadius: 8,
              marginTop: 24,
            }}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (isLoading && cartItems.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2C7A7B" />
        <Text style={{ marginTop: 12, color: '#718096' }}>Loading cart...</Text>
      </SafeAreaView>
    )
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
        <View style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
        }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1A202C' }}>My Cart</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="cart-outline" size={64} color="#CBD5E0" />
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#2D3748', marginTop: 16 }}>
            Your cart is empty
          </Text>
          <Text style={{ fontSize: 14, color: '#718096', marginTop: 8 }}>
            Start shopping now!
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#2C7A7B',
              paddingHorizontal: 32,
              paddingVertical: 12,
              borderRadius: 8,
              marginTop: 24,
            }}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      Alert.alert(
        'Remove Item',
        'Do you want to remove this item from cart?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => handleRemoveItem(productId) }
        ]
      )
      return
    }
    // ✅ Instant update - no reload
    setUpdatingItemId(productId)
    updateQuantity(productId, newQuantity)
    setTimeout(() => setUpdatingItemId(null), 300)
  }

  const handleRemoveItem = (productId: string) => {
    // ✅ Instant remove - no reload
    removeFromCart(productId)
  }

  const navigateToProductDetail = (productId: string) => {
    navigation.navigate('ProductDetail', { productId })
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      <View style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
      }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1A202C' }}>My Cart ({cartCount} items)</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {cartItems.map((item) => {
          const isUpdating = updatingItemId === item.product_id

          return (
            <TouchableOpacity
              key={item.id}
              style={{
                flexDirection: 'row',
                backgroundColor: '#fff',
                marginHorizontal: 16,
                marginTop: 12,
                padding: 12,
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
                opacity: isUpdating ? 0.7 : 1,
              }}
              activeOpacity={0.7}
              onPress={() => navigateToProductDetail(item.product_id)}
            >
              <Image
                source={{ uri: item.product?.images?.[0] || 'https://via.placeholder.com/80' }}
                style={{ width: 80, height: 80, borderRadius: 8 }}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#2D3748' }}>
                  {item.product?.name || 'Product'}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2C7A7B', marginTop: 4 }}>
                  Rs {(item.product?.price || 0).toFixed(2)}
                </Text>
                {item.selected_color && (
                  <Text style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
                    Color: {item.selected_color}
                  </Text>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <TouchableOpacity
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: '#EDF2F7',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                    disabled={isUpdating}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600' }}>-</Text>
                  </TouchableOpacity>
                  
                  <View style={{ marginHorizontal: 12, minWidth: 30, alignItems: 'center' }}>
                    {isUpdating ? (
                      <ActivityIndicator size="small" color="#2C7A7B" />
                    ) : (
                      <Text style={{ fontSize: 16, fontWeight: '600' }}>
                        {item.quantity}
                      </Text>
                    )}
                  </View>
                  
                  <TouchableOpacity
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: '#2C7A7B',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                    disabled={isUpdating}
                  >
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={{ padding: 4, justifyContent: 'center' }}
                onPress={() => {
                  Alert.alert(
                    'Remove Item',
                    `Remove "${item.product?.name || 'item'}" from cart?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => handleRemoveItem(item.product_id) }
                    ]
                  )
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#E53E3E" />
              </TouchableOpacity>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Footer */}
      <View style={{
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 16, color: '#4A5568' }}>Subtotal</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#2D3748' }}>
            Rs {cartTotal.toFixed(2)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 16, color: '#4A5568' }}>Delivery Fee</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#2D3748' }}>
            Rs {cartTotal > 0 ? '30.00' : '0.00'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1A202C' }}>Total</Text>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2C7A7B' }}>
            Rs {(cartTotal + (cartTotal > 0 ? 30 : 0)).toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: cartItems.length > 0 ? '#2C7A7B' : '#A0AEC0',
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
          }}
          disabled={cartItems.length === 0}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            Proceed to Checkout ({cartCount} items)
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}