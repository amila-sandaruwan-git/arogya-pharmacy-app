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
import { ProductService } from '../../services/product.service'
import { useNavigation } from '@react-navigation/native'

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  averageRating: number
  statusCounts: {
    pending: number
    picking: number
    packing: number
    shipping: number
    delivered: number
    cancelled: number
  }
}

export default function PharmacistHome() {
  const { user } = useAuth()
  const navigation = useNavigation()
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    averageRating: 0,
    statusCounts: {
      pending: 0,
      picking: 0,
      packing: 0,
      shipping: 0,
      delivered: 0,
      cancelled: 0,
    }
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setIsLoading(true)
    try {
      console.log('📊 Loading pharmacist dashboard...')
      
      // Get all orders
      const orders = await OrderService.getPharmacistOrders()
      console.log(`📊 Found ${orders.length} orders`)

      // Calculate statistics
      const statusCounts = {
        pending: 0,
        picking: 0,
        packing: 0,
        shipping: 0,
        delivered: 0,
        cancelled: 0,
      }

      let totalRevenue = 0

      orders.forEach((order: any) => {
        // Count by status
        if (statusCounts.hasOwnProperty(order.order_status)) {
          statusCounts[order.order_status as keyof typeof statusCounts]++
        }
        
        // Add revenue for non-cancelled orders
        if (order.order_status !== 'cancelled') {
          totalRevenue += order.total_amount || 0
        }
      })

      // Get total products
      const products = await ProductService.getProducts({ pharmacistId: user?.id })
      
      // Get unread messages count (from chat context)
      // You can integrate with your chat service here

      setStats({
        totalOrders: orders.length,
        totalRevenue: totalRevenue,
        totalProducts: products.length,
        averageRating: 0, // You can implement rating system later
        statusCounts,
      })

      // Get recent orders (last 5)
      setRecentOrders(orders.slice(0, 5))

    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboard()
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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      picking: 'Picking',
      packing: 'Packing',
      shipping: 'Shipping',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    }
    return labels[status] || status
  }

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      pending: 'time-outline',
      picking: 'scan-outline',
      packing: 'cube-outline',
      shipping: 'car-outline',
      delivered: 'checkmark-circle-outline',
      cancelled: 'close-circle-outline',
    }
    return icons[status] || 'ellipse-outline'
  }

  const StatCard = ({ 
    icon, 
    label, 
    value, 
    color = '#2C7A7B',
    onPress 
  }: { 
    icon: string, 
    label: string, 
    value: number | string, 
    color?: string,
    onPress?: () => void 
  }) => (
    <TouchableOpacity 
      style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        flex: 1,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        alignItems: 'center',
      }}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: color + '20',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={{
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A202C',
        marginTop: 8,
      }}>
        {value}
      </Text>
      <Text style={{
        fontSize: 12,
        color: '#718096',
        textAlign: 'center',
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  )

  const StatusBadge = ({ status, count }: { status: string, count: number }) => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
      }}
      onPress={() => {
        // Navigate to orders with filter
        navigation.navigate('Orders' as never)
      }}
    >
      <View style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: getStatusColor(status),
        marginRight: 6,
      }} />
      <Text style={{ fontSize: 12, color: '#4A5568' }}>
        {getStatusLabel(status)}
      </Text>
      {count > 0 && (
        <View style={{
          backgroundColor: getStatusColor(status) + '20',
          borderRadius: 10,
          paddingHorizontal: 6,
          paddingVertical: 1,
          marginLeft: 4,
        }}>
          <Text style={{
            fontSize: 10,
            fontWeight: '600',
            color: getStatusColor(status),
          }}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )

  const QuickAction = ({ icon, label, color, onPress }: { icon: string, label: string, color: string, onPress: () => void }) => (
    <TouchableOpacity
      style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
      onPress={onPress}
    >
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: color + '20',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={{
        fontSize: 12,
        color: '#4A5568',
        marginTop: 8,
        textAlign: 'center',
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  )

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2C7A7B" />
        <Text style={{ marginTop: 12, color: '#718096' }}>Loading dashboard...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          backgroundColor: '#2C7A7B',
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Welcome back,</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff' }}>
                {user?.full_name || user?.username || 'Pharmacist'}
              </Text>
            </View>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
            }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>👨‍⚕️ Pharmacist</Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
            <StatCard 
              icon="cube-outline" 
              label="Total Orders" 
              value={stats.totalOrders} 
              color="#fff"
            />
            <StatCard 
              icon="cash-outline" 
              label="Revenue(Rs.)" 
              value={`${stats.totalRevenue}`} 
              color="#fff"
            />
            <StatCard 
              icon="flask-outline" 
              label="Products" 
              value={stats.totalProducts} 
              color="#fff"
            />
          </View>
        </View>

        {/* Order Status Summary */}
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
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A202C' }}>
              📊 Order Status
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Orders' as never)}>
              <Text style={{ fontSize: 12, color: '#2C7A7B' }}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {Object.entries(stats.statusCounts).map(([status, count]) => (
              <StatusBadge key={status} status={status} count={count} />
            ))}
          </ScrollView>
        </View>

        {/* Quick Actions */}
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
            ⚡ Quick Actions
          </Text>
          <View style={{ flexDirection: 'row' }}>
            <QuickAction 
              icon="add-circle-outline" 
              label="Add Product" 
              color="#2C7A7B"
              onPress={() => navigation.navigate('AddItems' as never)}
            />
            <QuickAction 
              icon="list-outline" 
              label="View Orders" 
              color="#4299E1"
              onPress={() => navigation.navigate('Orders' as never)}
            />
            <QuickAction 
              icon="chatbubbles-outline" 
              label="Messages" 
              color="#9F7AEA"
              onPress={() => navigation.navigate('Messages' as never)}
            />
          </View>
        </View>

        {/* Recent Orders */}
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
          marginBottom: 40,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A202C' }}>
              🕐 Recent Orders
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Orders' as never)}>
              <Text style={{ fontSize: 12, color: '#2C7A7B' }}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Ionicons name="cube-outline" size={32} color="#CBD5E0" />
              <Text style={{ fontSize: 14, color: '#A0AEC0', marginTop: 8 }}>
                No recent orders
              </Text>
            </View>
          ) : (
            recentOrders.map((order, index) => (
              <TouchableOpacity
                key={order.id}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderBottomWidth: index < recentOrders.length - 1 ? 1 : 0,
                  borderBottomColor: '#E2E8F0',
                }}
                onPress={() => {
                  // Navigate to order detail if implemented
                }}
              >
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#2D3748' }}>
                    Order #{order.delivery_code || order.id.slice(-6)}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#718096' }}>
                    {order.user?.username || 'User'} • Rs{order.total_amount?.toFixed(2) || 0}
                  </Text>
                </View>
                <View style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                  backgroundColor: getStatusColor(order.order_status) + '20',
                }}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: getStatusColor(order.order_status),
                  }}>
                    {getStatusLabel(order.order_status)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}