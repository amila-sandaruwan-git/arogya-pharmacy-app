import { supabase } from '../config/supabase'
import { User } from '../types'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const AuthService = {
  async sendOTP(phoneNumber: string): Promise<void> {
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Store OTP in Supabase
    const { error } = await supabase
      .from('otp_verifications')
      .insert({
        phone_number: phoneNumber,
        otp_code: otp,
        expires_at: new Date(Date.now() + 5 * 60000).toISOString()
      })

    if (error) {
      console.error('Error storing OTP:', error)
      // Fallback to AsyncStorage
      await AsyncStorage.setItem(`otp_${phoneNumber}`, otp)
    }
    
    console.log(`🔐 OTP for ${phoneNumber}: ${otp}`)
  },

  async verifyOTP(phoneNumber: string, otp: string): Promise<User> {
    // Check OTP in Supabase
    const { data: otpData, error: otpError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('otp_code', otp)
      .single()

    // If not found in Supabase, check AsyncStorage fallback
    if (otpError || !otpData) {
      const storedOTP = await AsyncStorage.getItem(`otp_${phoneNumber}`)
      if (storedOTP !== otp) {
        throw new Error('Invalid OTP')
      }
    } else {
      // Check if OTP is expired
      if (new Date(otpData.expires_at) < new Date()) {
        throw new Error('OTP expired')
      }

      // Mark OTP as verified
      await supabase
        .from('otp_verifications')
        .update({ is_verified: true })
        .eq('id', otpData.id)
    }

    // Get or create user in Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single()

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist, create new
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          phone_number: phoneNumber,
          username: `User_${phoneNumber.slice(-4)}`,
          last_login: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) throw createError
      
      // Store in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(newUser))
      return newUser
    } else if (userError) {
      throw userError
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userData.id)

    // Store in AsyncStorage
    await AsyncStorage.setItem('user', JSON.stringify(userData))
    return userData
  },

  async getUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem('user')
    if (!userStr) return null
    return JSON.parse(userStr)
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('user')
  },

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    const { data: updated, error } = await supabase
      .from('users')
      .update(data)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    
    // Update stored user
    await AsyncStorage.setItem('user', JSON.stringify(updated))
    return updated
  },

  async getPharmacist(): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_pharmacist', true)
      .limit(1)
      .single()

    if (error) return null
    return data
  }
}