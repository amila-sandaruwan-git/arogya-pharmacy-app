import { supabase } from '../config/supabase'
import { CartItem, Product } from '../types'

export const CartService = {
  async getCartItems(userId: string): Promise<CartItem[]> {
    try {
      const { data, error } = await supabase
        .from('cart')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', userId)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching cart:', error)
      return []
    }
  },

  async addToCart(userId: string, productId: string, quantity: number = 1, color?: string): Promise<CartItem> {
    try {
      // Check if item already exists in cart
      const { data: existing, error: checkError } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('selected_color', color || null)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existing) {
        // Update quantity
        const { data, error } = await supabase
          .from('cart')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id)
          .select(`
            *,
            product:products(*)
          `)
          .single()

        if (error) throw error
        return data
      } else {
        // Insert new item
        const { data, error } = await supabase
          .from('cart')
          .insert({
            user_id: userId,
            product_id: productId,
            quantity,
            selected_color: color || null
          })
          .select(`
            *,
            product:products(*)
          `)
          .single()

        if (error) throw error
        return data
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      throw error
    }
  },

  async updateQuantity(userId: string, productId: string, quantity: number): Promise<void> {
    try {
      if (quantity <= 0) {
        await this.removeFromCart(userId, productId)
        return
      }

      const { error } = await supabase
        .from('cart')
        .update({ quantity })
        .eq('user_id', userId)
        .eq('product_id', productId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating quantity:', error)
      throw error
    }
  },

  async removeFromCart(userId: string, productId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId)

      if (error) throw error
    } catch (error) {
      console.error('Error removing from cart:', error)
      throw error
    }
  },

  async clearCart(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', userId)

      if (error) throw error
    } catch (error) {
      console.error('Error clearing cart:', error)
      throw error
    }
  },

  async getCartTotal(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('cart')
        .select(`
          quantity,
          product:products(price)
        `)
        .eq('user_id', userId)

      if (error) throw error
      
      // ✅ Fixed: Properly access the price from the product object
      let total = 0
      if (data && data.length > 0) {
        data.forEach((item: any) => {
          // ✅ Get price from the product object (which is an array in Supabase response)
          const productData = item.product
          // Supabase returns product as an array when using select with nested relations
          const price = Array.isArray(productData) 
            ? (productData[0]?.price || 0) 
            : (productData?.price || 0)
          total += price * item.quantity
        })
      }
      return total
    } catch (error) {
      console.error('Error getting cart total:', error)
      return 0
    }
  },

  async getCartCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('cart')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error getting cart count:', error)
      return 0
    }
  }
}