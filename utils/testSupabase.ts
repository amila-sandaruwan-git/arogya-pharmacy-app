import { supabase } from '../config/supabase'

export const testSupabaseConnection = async () => {
  try {
    console.log('🔗 Testing Supabase connection...')
    
    // Test fetching products
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Supabase connection error:', error.message)
      return false
    }

    console.log('✅ Supabase connected successfully!')
    console.log('📦 Products count:', data?.length || 0)
    if (data && data.length > 0) {
      console.log('📦 Sample product:', data[0].name)
    }
    return true
  } catch (error: any) {
    console.error('❌ Supabase test failed:', error?.message || error)
    return false
  }
}