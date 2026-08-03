import React, { createContext, useState, useContext, useEffect } from 'react'
import { Order } from '../types'
import { useAuth } from './AuthContext'
import { OrderService } from '../services/order.service'

interface OrderContextType {
  orders: Order[]
  activeOrders: Order[]
  orderHistory: Order[]
  isLoading: boolean
  createOrder: (data: any) => Promise<Order>
  refreshOrders: () => Promise<void>  // ✅ Add this
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadOrders()
    }
  }, [user])

  const loadOrders = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const data = await OrderService.getOrders(user.id)
      setOrders(data)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ Add refreshOrders function
  const refreshOrders = async () => {
    await loadOrders()
  }

  const activeOrders = orders.filter(o => 
    o.order_status !== 'delivered' && o.order_status !== 'cancelled'
  )
  const orderHistory = orders.filter(o => 
    o.order_status === 'delivered' || o.order_status === 'cancelled'
  )

  const createOrder = async (data: any): Promise<Order> => {
    // Implementation
    return {} as Order
  }

  return (
    <OrderContext.Provider value={{
      orders,
      activeOrders,
      orderHistory,
      isLoading,
      createOrder,
      refreshOrders,  // ✅ Add this
    }}>
      {children}
    </OrderContext.Provider>
  )
}

export const useOrders = () => {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider')
  }
  return context
}