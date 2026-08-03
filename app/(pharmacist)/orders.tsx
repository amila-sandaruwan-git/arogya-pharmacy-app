import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../context/AuthContext'
import { OrderService } from '../../services/order.service'
import { Order } from '../../types'
import { useRoute, useNavigation } from '@react-navigation/native'

const ORDER_STATUSES = ['pending', 'picking', 'packing', 'shipping', 'delivered', 'cancelled']

// ✅ Define icon mapping with proper type
const statusIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  pending: 'time-outline',
  picking: 'scan-outline',
  packing: 'cube-outline',
  shipping: 'car-outline',
  delivered: 'checkmark-circle-outline',
  cancelled: 'close-circle-outline',
}

export default function PharmacistOrders() {
  const { user } = useAuth()
  const navigation = useNavigation()
  const route = useRoute()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})

  // ✅ Get filter from route params when coming from dashboard
  useEffect(() => {
    const params = route.params as { filter?: string } | undefined
    if (params?.filter && ORDER_STATUSES.includes(params.filter)) {
      setSelectedStatus(params.filter)
    }
  }, [route.params])

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      console.log('📋 Loading pharmacist orders...')
      const data = await OrderService.getPharmacistOrders()
      console.log(`📋 Found ${data.length} orders`)
      setOrders(data)
      
      // Calculate status counts
      const counts: Record<string, number> = {}
      data.forEach(order => {
        counts[order.order_status] = (counts[order.order_status] || 0) + 1
      })
      setStatusCounts(counts)
      
      // ✅ Apply filter after loading
      applyFilter(selectedStatus, data)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilter = (status: string | null, orderData?: Order[]) => {
    const data = orderData || orders
    if (status) {
      setFilteredOrders(data.filter(o => o.order_status === status))
    } else {
      setFilteredOrders(data)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadOrders()
    setRefreshing(false)
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!user) return
    try {
      await OrderService.updateOrderStatus(orderId, newStatus, user.id)
      await loadOrders()
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  const handleFilter = (status: string | null) => {
    setSelectedStatus(status)
    applyFilter(status)
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
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    }
    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getPaymentLabel = (method: string, status: string) => {
    if (method === 'cash' && status === 'pending') return '💰 Cash (Pending)'
    if (method === 'cash') return '💰 Cash'
    if (method === 'card') return '💳 Card'
    return '❓ Unknown'
  }

  // ✅ Category Card Component - Fixed Icon Type
  const CategoryCard = ({ status, count, isSelected }: { status: string, count: number, isSelected: boolean }) => {
    // Get icon for status
    const iconName: keyof typeof Ionicons.glyphMap = status === 'all' ? 'grid-outline' : (statusIcons[status] || 'ellipse-outline')
    const statusColor = status === 'all' ? '#2C7A7B' : getStatusColor(status)
    const displayLabel = status === 'all' ? 'All' : getStatusLabel(status)

    return (
      <TouchableOpacity
        style={{
          backgroundColor: isSelected ? statusColor : '#fff',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 12,
          marginRight: 10,
          borderWidth: isSelected ? 0 : 1,
          borderColor: '#E2E8F0',
          minWidth: 80,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isSelected ? 0.1 : 0.05,
          shadowRadius: 4,
          elevation: isSelected ? 3 : 1,
        }}
        onPress={() => handleFilter(isSelected ? null : status === 'all' ? null : status)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons 
            name={iconName} 
            size={16} 
            color={isSelected ? '#fff' : statusColor} 
          />
          <Text style={{
            fontSize: 13,
            fontWeight: isSelected ? '600' : '500',
            color: isSelected ? '#fff' : '#2D3748',
            marginLeft: 6,
          }}>
            {displayLabel}
          </Text>
        </View>
        {count > 0 && (
          <View style={{
            backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : statusColor + '20',
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 2,
            marginTop: 4,
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '700',
              color: isSelected ? '#fff' : statusColor,
            }}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  const renderOrder = ({ item: order }: { item: Order }) => (
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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A202C' }}>
            Order #{order.delivery_code || order.id.slice(-6)}
          </Text>
          <Text style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
            {order.user?.username || 'User'} • {new Date(order.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={{
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 12,
          backgroundColor: getStatusBgColor(order.order_status),
        }}>
          <Text style={{ 
            fontSize: 12, 
            fontWeight: '600', 
            color: getStatusColor(order.order_status) 
          }}>
            {getStatusLabel(order.order_status).toUpperCase()}
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

      <View style={{ marginTop: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#2D3748' }}>
          Rs {order.total_amount.toFixed(2)}
        </Text>
        <Text style={{ fontSize: 12, color: '#718096' }}>
          {order.items?.length || 0} items • {order.delivery_address?.substring(0, 40)}...
        </Text>
      </View>

      {/* Delivery Code */}
      {order.delivery_code && (
        <View style={{
          backgroundColor: '#EBF8FF',
          padding: 8,
          borderRadius: 6,
          marginTop: 8,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Ionicons name="key-outline" size={16} color="#2B6CB0" />
          <Text style={{ fontSize: 13, color: '#2B6CB0', marginLeft: 8 }}>
            Delivery Code: <Text style={{ fontWeight: 'bold', letterSpacing: 2 }}>{order.delivery_code}</Text>
          </Text>
        </View>
      )}

      {/* ✅ Status Update Buttons */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 6 }}>
        {ORDER_STATUSES.filter(s => 
          s !== order.order_status && 
          s !== 'cancelled'
        ).map((status) => (
          <TouchableOpacity
            key={status}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: status === 'delivered' ? '#F0FFF4' : '#EDF2F7',
              borderWidth: status === 'delivered' ? 1 : 0,
              borderColor: status === 'delivered' ? '#2C7A7B' : 'transparent',
            }}
            onPress={() => updateOrderStatus(order.id, status)}
          >
            <Text style={{ 
              fontSize: 12, 
              color: status === 'delivered' ? '#2C7A7B' : '#4A5568',
              fontWeight: status === 'delivered' ? '600' : '400',
            }}>
              {getStatusLabel(status)}
            </Text>
          </TouchableOpacity>
        ))}
        {order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (
          <TouchableOpacity
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: '#FFF5F5',
              borderWidth: 1,
              borderColor: '#FED7D7',
            }}
            onPress={() => updateOrderStatus(order.id, 'cancelled')}
          >
            <Text style={{ fontSize: 12, color: '#E53E3E' }}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2C7A7B" />
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1A202C' }}>📋 Orders</Text>
          {selectedStatus && (
            <TouchableOpacity onPress={() => handleFilter(null)}>
              <Text style={{ fontSize: 12, color: '#2C7A7B' }}>Clear Filter</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
          Total: {orders.length} orders
          {selectedStatus && ` • Filtered: ${getStatusLabel(selectedStatus)}`}
        </Text>
      </View>

      {/* ✅ Categories / Status Filters with Icons and Counts */}
      <View style={{
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
      }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {/* All Categories Card */}
          <CategoryCard 
            status="all" 
            count={orders.length} 
            isSelected={!selectedStatus} 
          />
          {ORDER_STATUSES.map(status => (
            <CategoryCard 
              key={status}
              status={status} 
              count={statusCounts[status] || 0} 
              isSelected={selectedStatus === status} 
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Ionicons name="cube-outline" size={64} color="#CBD5E0" />
            <Text style={{ fontSize: 16, color: '#718096', marginTop: 16 }}>
              {selectedStatus ? `No ${getStatusLabel(selectedStatus)} orders` : 'No orders found'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}