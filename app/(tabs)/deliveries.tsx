import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../context/AuthContext'
import { OrderService } from '../../services/order.service'
import { Order } from '../../types'

export default function DeliveriesScreen() {
  const { user } = useAuth()
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  const [orderHistory, setOrderHistory] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const orders = await OrderService.getOrders(user.id)
      
      // Separate active and history
      const active = orders.filter(o => 
        o.order_status !== 'delivered' && o.order_status !== 'cancelled'
      )
      const history = orders.filter(o => 
        o.order_status === 'delivered' || o.order_status === 'cancelled'
      )
      
      setActiveOrders(active)
      setOrderHistory(history)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadOrders()
    setRefreshing(false)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#ED8936',
      picking: '#4299E1',
      packing: '#9F7AEA',
      shipping: '#48BB78',
      delivered: '#2C7A7B',
      cancelled: '#E53E3E',
    }
    return colors[status] || '#718096'
  }

  const getStatusBgColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#FEFCBF',
      picking: '#EBF8FF',
      packing: '#FAF5FF',
      shipping: '#F0FFF4',
      delivered: '#F0FFF4',
      cancelled: '#FFF5F5',
    }
    return colors[status] || '#F7FAFC'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      picking: 'Picking',
      packing: 'Packing',
      shipping: 'Shipping',
      delivered: '✅ Delivered',
      cancelled: 'Cancelled',
    }
    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getStatusStep = (status: string) => {
    const steps = ['pending', 'picking', 'packing', 'shipping', 'delivered']
    return steps.indexOf(status)
  }

  const getPaymentLabel = (method: string, status: string) => {
    if (method === 'cash' && status === 'pending') return '💰 Cash (Pending)'
    if (method === 'cash') return '💰 Cash'
    if (method === 'card') return '💳 Card (Paid)'
    return '❓ Unknown'
  }

  const OrderCard = ({ order }: { order: Order }) => {
    const currentStep = getStatusStep(order.order_status)
    const steps = ['Pending', 'Picking', 'Packing', 'Shipping', 'Delivered']
    const isDelivered = order.order_status === 'delivered'
    const isCancelled = order.order_status === 'cancelled'

    return (
      <View style={{
        backgroundColor: isDelivered ? '#F0FFF4' : isCancelled ? '#FFF5F5' : '#fff',
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        borderRadius: 12,
        borderWidth: isDelivered ? 1 : 0,
        borderColor: isDelivered ? '#C6F6D5' : 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}>
        {/* Order Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ 
              fontSize: 14, 
              color: isDelivered ? '#276749' : '#4A5568',
              fontWeight: isDelivered ? '600' : '400',
            }}>
              Order #{order.delivery_code || order.id.slice(-6)}
            </Text>
            <Text style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
              {new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString()}
            </Text>
          </View>
          <View style={{
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
            backgroundColor: isDelivered ? '#C6F6D5' : isCancelled ? '#FED7D7' : getStatusBgColor(order.order_status),
          }}>
            <Text style={{ 
              fontSize: 12, 
              fontWeight: '600', 
              color: isDelivered ? '#276749' : isCancelled ? '#9B2C2C' : getStatusColor(order.order_status) 
            }}>
              {isDelivered ? '✅ Delivered' : isCancelled ? '❌ Cancelled' : getStatusLabel(order.order_status)}
            </Text>
          </View>
        </View>

        {/* Payment Status */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 8,
          padding: 8,
          backgroundColor: order.payment_status === 'paid' ? '#F0FFF4' : '#FEFCBF',
          borderRadius: 6,
        }}>
          <Text style={{
            fontSize: 12,
            color: order.payment_status === 'paid' ? '#276749' : '#D69E2E',
          }}>
            {getPaymentLabel(order.payment_method, order.payment_status)}
          </Text>
        </View>

        {/* Order Details */}
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#2D3748' }}>
            Rs {order.total_amount.toFixed(2)}
          </Text>
          <Text style={{ fontSize: 12, color: '#718096' }}>
            {order.items?.length || 0} items • {order.delivery_address?.substring(0, 40)}...
          </Text>
        </View>

        {/* ✅ Delivery PIN (4-digit code) */}
        {order.delivery_code && (
          <View style={{
            backgroundColor: isDelivered ? '#C6F6D5' : '#EBF8FF',
            padding: 10,
            borderRadius: 8,
            marginTop: 10,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: isDelivered ? '#9AE6B4' : '#BEE3F8',
          }}>
            <Ionicons name="key-outline" size={20} color={isDelivered ? '#276749' : '#2B6CB0'} />
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '700', 
              color: isDelivered ? '#276749' : '#2B6CB0', 
              marginLeft: 10,
              letterSpacing: 4,
            }}>
              {order.delivery_code}
            </Text>
            {isDelivered && (
              <Text style={{ 
                fontSize: 12, 
                color: '#276749', 
                marginLeft: 8,
                fontWeight: '500',
              }}>
                ✓ Used
              </Text>
            )}
          </View>
        )}

        {/* ✅ Order Status Progress - Only show for active orders */}
        {!isDelivered && !isCancelled && (
          <View style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              {steps.map((step, index) => (
                <View key={index} style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: index <= currentStep ? '#2C7A7B' : '#E2E8F0',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    {index < currentStep ? (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    ) : index === currentStep ? (
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' }} />
                    ) : (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#A0AEC0' }} />
                    )}
                  </View>
                  <Text style={{
                    fontSize: 8,
                    color: index <= currentStep ? '#2C7A7B' : '#A0AEC0',
                    marginTop: 4,
                    textAlign: 'center',
                  }}>
                    {step}
                  </Text>
                </View>
              ))}
            </View>
            <View style={{
              position: 'absolute',
              top: 12,
              left: 20,
              right: 20,
              height: 2,
              backgroundColor: '#E2E8F0',
              zIndex: -1,
            }}>
              <View style={{
                width: `${(currentStep / (steps.length - 1)) * 100}%`,
                height: 2,
                backgroundColor: '#2C7A7B',
              }} />
            </View>
          </View>
        )}

        {/* ✅ Delivered Badge */}
        {isDelivered && (
          <View style={{
            marginTop: 12,
            padding: 10,
            backgroundColor: '#C6F6D5',
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Ionicons name="checkmark-circle" size={20} color="#276749" />
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#276749',
              marginLeft: 8,
            }}>
              Delivered on {new Date(order.updated_at || order.created_at).toLocaleDateString()}
            </Text>
          </View>
        )}

        {/* ✅ Cancelled Badge */}
        {isCancelled && (
          <View style={{
            marginTop: 12,
            padding: 10,
            backgroundColor: '#FED7D7',
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Ionicons name="close-circle" size={20} color="#9B2C2C" />
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#9B2C2C',
              marginLeft: 8,
            }}>
              Order Cancelled
            </Text>
          </View>
        )}
      </View>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2C7A7B" />
        <Text style={{ marginTop: 12, color: '#718096' }}>Loading orders...</Text>
      </SafeAreaView>
    )
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
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1A202C' }}>My Deliveries</Text>
        {activeOrders.length > 0 && (
          <Text style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
            {activeOrders.length} active {activeOrders.length === 1 ? 'order' : 'orders'}
          </Text>
        )}
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeOrders.length === 0 && orderHistory.length === 0 ? (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Ionicons name="cube-outline" size={64} color="#CBD5E0" />
            <Text style={{ fontSize: 16, color: '#718096', marginTop: 16, textAlign: 'center' }}>
              No deliveries yet
            </Text>
            <Text style={{ fontSize: 14, color: '#A0AEC0', marginTop: 8, textAlign: 'center' }}>
              Your orders will appear here
            </Text>
          </View>
        ) : (
          <>
            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#2C7A7B',
                  paddingHorizontal: 16,
                  marginTop: 8,
                }}>
                  📦 Active Orders ({activeOrders.length})
                </Text>
                {activeOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </>
            )}

            {/* Order History - Delivered & Cancelled */}
            {orderHistory.length > 0 && (
              <>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#4A5568',
                  paddingHorizontal: 16,
                  marginTop: 16,
                }}>
                  📋 Order History ({orderHistory.length})
                </Text>
                {orderHistory.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </>
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}