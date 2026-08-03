import { supabase } from '../config/supabase'
import { Product } from '../types'

export const ProductService = {
  async getProducts(filters?: {
    category?: string
    isPublished?: boolean
    search?: string
    pharmacistId?: string
  }): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select('*')

    if (filters?.isPublished !== undefined) {
      query = query.eq('is_published', filters.isPublished)
    }

    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category)
    }

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }

    if (filters?.pharmacistId) {
      query = query.eq('pharmacist_id', filters.pharmacistId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getPopularProducts(limit: number = 10): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_published', true)
      .eq('is_popular', true)
      .order('sales_count', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  async getNewProducts(limit: number = 10): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  async getProductById(id: string): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async createProduct(product: any): Promise<Product> {
    // ✅ ALWAYS use placeholder images - never save local file:// URIs
    const cleanImages = [
      `https://via.placeholder.com/300x300/2C7A7B/FFFFFF?text=${encodeURIComponent(product.name || 'Product')}`
    ]

    const { data, error } = await supabase
      .from('products')
      .insert({
        ...product,
        images: cleanImages, // ✅ Always use placeholder
        sales_count: 0,
        rating: 0,
        total_reviews: 0,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateProduct(id: string, updates: any): Promise<Product> {
    // ✅ Always clean images - never save local file:// URIs
    if (updates.images) {
      const validImages = updates.images.filter((img: string) => 
        img && typeof img === 'string' && img.startsWith('http')
      )
      
      if (validImages.length === 0) {
        updates.images = [
          `https://via.placeholder.com/300x300/2C7A7B/FFFFFF?text=${encodeURIComponent(updates.name || 'Product')}`
        ]
      } else {
        updates.images = validImages
      }
    }

    const { data, error } = await supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async togglePublish(id: string): Promise<Product> {
    const { data: product } = await supabase
      .from('products')
      .select('is_published')
      .eq('id', id)
      .single()

    const { data, error } = await supabase
      .from('products')
      .update({ is_published: !product?.is_published })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // ✅ Skip upload entirely - just return placeholder
  async uploadProductImages(productId: string, localImages: string[]): Promise<string[]> {
    console.log('📷 Using placeholder images (upload skipped)')
    return [
      `https://via.placeholder.com/300x300/2C7A7B/FFFFFF?text=Product`
    ]
  }
}