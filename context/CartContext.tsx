import React, { createContext, useState, useContext, useEffect } from 'react'
import { CartItem } from '../types'
import { useAuth } from './AuthContext'
import { CartService } from '../services/cart.service'

interface CartContextType {
  cartItems: CartItem[]
  cartCount: number
  cartTotal: number
  addToCart: (productId: string, quantity?: number, color?: string) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  isLoading: boolean
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cartItems.reduce((sum, item) => {
    const price = item.product?.price || 0
    return sum + (price * item.quantity)
  }, 0)

  const fetchCartItems = async () => {
    if (!user) {
      setCartItems([])
      return
    }
    
    setIsLoading(true)
    try {
      const items = await CartService.getCartItems(user.id)
      setCartItems(items)
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchCartItems()
    } else {
      setCartItems([])
    }
  }, [user])

  const refreshCart = async () => {
    await fetchCartItems()
  }

  // ✅ Optimistic Add to Cart
  const addToCart = async (productId: string, quantity: number = 1, color?: string) => {
    if (!user) throw new Error('Please login to add items to cart')
    
    // ✅ Update UI immediately (optimistic)
    const existingItem = cartItems.find(
      item => item.product_id === productId && item.selected_color === (color || null)
    )

    if (existingItem) {
      // Update quantity in UI immediately
      setCartItems(prev =>
        prev.map(item =>
          item.product_id === productId && item.selected_color === (color || null)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      )
    } else {
      // Add new item to UI immediately (with placeholder product data)
      const newItem: CartItem = {
        id: `temp-${Date.now()}`,
        user_id: user.id,
        product_id: productId,
        quantity: quantity,
        selected_color: color || null,
        product: undefined, // Will be filled by server response
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setCartItems(prev => [...prev, newItem])
    }

    // ✅ Sync with server in background
    try {
      const result = await CartService.addToCart(user.id, productId, quantity, color)
      // Update with server data
      setCartItems(prev =>
        prev.map(item =>
          item.id === result.id || (item.product_id === productId && item.selected_color === (color || null))
            ? result
            : item
        )
      )
    } catch (error) {
      console.error('Error adding to cart:', error)
      // Revert optimistic update on error
      await fetchCartItems()
      throw error
    }
  }

  // ✅ Optimistic Remove from Cart
  const removeFromCart = async (productId: string) => {
    if (!user) return

    // ✅ Update UI immediately (optimistic)
    const itemToRemove = cartItems.find(item => item.product_id === productId)
    if (itemToRemove) {
      setCartItems(prev => prev.filter(item => item.product_id !== productId))
    }

    // ✅ Sync with server in background
    try {
      await CartService.removeFromCart(user.id, productId)
    } catch (error) {
      console.error('Error removing from cart:', error)
      // Revert optimistic update on error
      await fetchCartItems()
      throw error
    }
  }

  // ✅ Optimistic Update Quantity
  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return

    if (quantity <= 0) {
      await removeFromCart(productId)
      return
    }

    // ✅ Update UI immediately (optimistic)
    setCartItems(prev =>
      prev.map(item =>
        item.product_id === productId
          ? { ...item, quantity }
          : item
      )
    )

    // ✅ Sync with server in background
    try {
      await CartService.updateQuantity(user.id, productId, quantity)
    } catch (error) {
      console.error('Error updating quantity:', error)
      // Revert optimistic update on error
      await fetchCartItems()
      throw error
    }
  }

  const clearCart = async () => {
    if (!user) return

    // ✅ Update UI immediately (optimistic)
    setCartItems([])

    // ✅ Sync with server in background
    try {
      await CartService.clearCart(user.id)
    } catch (error) {
      console.error('Error clearing cart:', error)
      await fetchCartItems()
      throw error
    }
  }

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      cartTotal,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isLoading,
      refreshCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}