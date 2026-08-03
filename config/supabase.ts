import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

// 🔥 YOUR ACTUAL SUPABASE CREDENTIALS
const SUPABASE_URL = 'https://vnbtaqdtvydsldzffbau.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuYnRhcWR0dnlkc2xkemZmYmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1OTM1MDYsImV4cCI6MjEwMTE2OTUwNn0.UR3wBLtCPg8Zj3BC31yjpzQaxTEAsGcVntRX5mA93tg'

console.log('🔗 Supabase URL configured:', SUPABASE_URL)

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Helper: Get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Helper: Sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    console.log('✅ User signed out successfully')
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

// Helper: Check if Supabase is connected
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
    
    if (!error) {
      console.log('✅ Supabase connection successful')
      return true
    }
    
    console.error('❌ Supabase connection error:', error.message)
    return false
  } catch (error) {
    console.error('❌ Supabase connection failed:', error)
    return false
  }
}

export default supabase