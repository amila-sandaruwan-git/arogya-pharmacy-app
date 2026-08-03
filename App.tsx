import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { OrderProvider } from './context/OrderContext'
import { ChatProvider } from './context/ChatContext'
import RootNavigator from './navigation/RootNavigator'
import { testSupabaseConnection } from './utils/testSupabase'
import { Platform, View } from 'react-native'

export default function App() {
  useEffect(() => {
    testSupabaseConnection()
  }, [])

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#2C7A7B" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
        <AuthProvider>
          <CartProvider>
            <OrderProvider>
              <ChatProvider>
                <NavigationContainer>
                  <RootNavigator />
                </NavigationContainer>
              </ChatProvider>
            </OrderProvider>
          </CartProvider>
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}