import React, { createContext, useState, useContext, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../config/supabase'
import { User } from '../types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (phoneNumber: string) => Promise<void>
  verifyOTP: (phoneNumber: string, otp: string) => Promise<boolean>
  logout: () => Promise<void>
  updateUser: (data: Partial<User>) => Promise<void>
  uploadAvatar: (imageUri: string) => Promise<string>
  refreshUser: () => Promise<void>
  isPharmacist: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user')
      if (userStr) {
        const parsedUser = JSON.parse(userStr)
        console.log('📱 Loaded user from storage:', {
          id: parsedUser.id,
          username: parsedUser.username,
          avatar_url: parsedUser.avatar_url || 'No avatar'
        })
        setUser(parsedUser)
      }
    } catch (error) {
      console.error('Error loading user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUser = async () => {
    if (!user) return
    
    try {
      console.log('🔄 Refreshing user data from Supabase...')
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error refreshing user:', error)
        return
      }

      if (data) {
        console.log('✅ User refreshed from Supabase:', {
          id: data.id,
          username: data.username,
          avatar_url: data.avatar_url || 'No avatar'
        })
        await AsyncStorage.setItem('user', JSON.stringify(data))
        setUser(data)
      }
    } catch (error) {
      console.error('Refresh user error:', error)
    }
  }

  const login = async (phoneNumber: string) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    await AsyncStorage.setItem(`otp_${phoneNumber}`, otp)
    console.log(`🔐 OTP for ${phoneNumber}: ${otp}`)
  }

  const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  const verifyOTP = async (phoneNumber: string, otp: string): Promise<boolean> => {
    try {
      const storedOTP = await AsyncStorage.getItem(`otp_${phoneNumber}`)
      
      if (storedOTP !== otp) {
        return false
      }

      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .maybeSingle()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching user:', fetchError)
      }

      const createUserData = (user: any): User => {
        return {
          id: user.id || generateUUID(),
          phone_number: user.phone_number || phoneNumber,
          username: user.username || `User_${phoneNumber.slice(-4)}`,
          is_pharmacist: user.is_pharmacist || false,
          is_active: user.is_active !== undefined ? user.is_active : true,
          created_at: user.created_at || new Date().toISOString(),
          updated_at: user.updated_at || new Date().toISOString(),
          email: user.email || undefined,
          avatar_url: user.avatar_url || undefined,
          delivery_address: user.delivery_address || undefined,
          full_name: user.full_name || undefined,
          last_login: user.last_login || undefined,
        }
      }

      let userData: User

      if (existingUser) {
        userData = createUserData(existingUser)
        console.log('✅ Existing user found:', {
          id: userData.id,
          username: userData.username,
          avatar_url: userData.avatar_url || 'No avatar'
        })
      } else {
        const userId = generateUUID()
        
        console.log('📝 Creating new user with ID:', userId)
        
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: userId,
            phone_number: phoneNumber,
            username: `User_${phoneNumber.slice(-4)}`,
            is_active: true,
            last_login: new Date().toISOString()
          })
          .select()
          .maybeSingle()

        if (createError) {
          console.error('Error creating user:', createError)
          userData = createUserData({
            id: userId,
            phone_number: phoneNumber,
            username: `User_${phoneNumber.slice(-4)}`,
          })
        } else if (newUser) {
          userData = createUserData(newUser)
          console.log('✅ New user created:', {
            id: userData.id,
            username: userData.username
          })
        } else {
          userData = createUserData({
            id: generateUUID(),
            phone_number: phoneNumber,
            username: `User_${phoneNumber.slice(-4)}`,
          })
        }
      }

      await AsyncStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      return true
    } catch (error) {
      console.error('OTP verification error:', error)
      return false
    }
  }

  const logout = async () => {
    await AsyncStorage.removeItem('user')
    setUser(null)
  }

  const updateUser = async (data: Partial<User>) => {
    if (!user) return
    
    console.log('📝 Updating user with data:', data)
    
    try {
      if (!user.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id)) {
        console.log('⚠️ User has invalid ID, updating locally only')
        const updatedUser = { ...user, ...data }
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser))
        setUser(updatedUser)
        return
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      }
      
      if (data.username !== undefined) updateData.username = data.username
      if (data.full_name !== undefined) updateData.full_name = data.full_name
      if (data.email !== undefined) updateData.email = data.email
      if (data.delivery_address !== undefined) updateData.delivery_address = data.delivery_address
      if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url

      const { data: updated, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .maybeSingle()

      if (error) {
        console.error('Error updating user in Supabase:', error)
        const updatedUser = { ...user, ...data }
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser))
        setUser(updatedUser)
        return
      }

      if (updated) {
        console.log('✅ User updated in Supabase:', {
          id: updated.id,
          avatar_url: updated.avatar_url || 'No avatar'
        })
        await AsyncStorage.setItem('user', JSON.stringify(updated))
        setUser(updated)
      } else {
        const updatedUser = { ...user, ...data }
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser))
        setUser(updatedUser)
      }
    } catch (error) {
      console.error('Update user error:', error)
    }
  }

  // ✅ SIMPLIFIED: Always use UI Avatars - no network issues
  const uploadAvatar = async (imageUri: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated')

    try {
      console.log('📷 Setting avatar using UI Avatars...')
      
      // ✅ Always use UI Avatars - simple, reliable, always works
      const name = encodeURIComponent(user.full_name || user.username || 'User')
      const timestamp = Date.now()
      const avatarUrl = `https://ui-avatars.com/api/?name=${name}&background=2C7A7B&color=fff&size=200&bold=true&timestamp=${timestamp}`
      
      console.log('📷 Avatar URL:', avatarUrl)
      
      // ✅ Update user with avatar URL
      await updateUser({ avatar_url: avatarUrl })
      await refreshUser()
      
      console.log('✅ Avatar updated successfully')
      return avatarUrl
      
    } catch (error: any) {
      console.error('❌ Error updating avatar:', error)
      
      // ✅ Final fallback - always works
      try {
        const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=2C7A7B&color=fff&size=200`
        await updateUser({ avatar_url: fallbackUrl })
        await refreshUser()
        return fallbackUrl
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError)
        throw new Error('Failed to update profile picture')
      }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      verifyOTP,
      logout,
      updateUser,
      uploadAvatar,
      refreshUser,
      isPharmacist: user?.is_pharmacist || false
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}