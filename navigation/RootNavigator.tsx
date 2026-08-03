import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import { RootStackParamList } from './types'
import AuthStack from './AuthStack'
import UserTabs from './UserTabs'
import PharmacistTabs from './PharmacistTabs'
import ProductDetailScreen from '../app/product/ProductDetailScreen'
import ChatScreen from '../app/chat/ChatScreen'
import CartScreen from '../app/(tabs)/cart'
import CheckoutScreen from '../app/checkout/CheckoutScreen'
import NotificationsScreen from '../app/(tabs)/notifications'

const Stack = createNativeStackNavigator<RootStackParamList>()

const RootNavigator: React.FC = () => {
  const { user, isLoading, isPharmacist } = useAuth()

  if (isLoading) {
    return null
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : isPharmacist ? (
        <>
          <Stack.Screen name="Pharmacist" component={PharmacistTabs} />
          {/* ✅ Add Chat screen for pharmacist */}
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen}
            options={{ 
              headerShown: true, 
              title: 'Chat with Customer',
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="Notifications" 
            component={NotificationsScreen}
            options={{ 
              headerShown: true, 
              title: 'Notifications',
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="User" component={UserTabs} />
          <Stack.Screen 
            name="ProductDetail" 
            component={ProductDetailScreen}
            options={{ 
              headerShown: true, 
              title: 'Product Details',
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen}
            options={{ 
              headerShown: true, 
              title: 'Chat with Pharmacist',
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="Cart" 
            component={CartScreen}
            options={{ 
              headerShown: true, 
              title: 'My Cart',
            }}
          />
          <Stack.Screen 
            name="Checkout" 
            component={CheckoutScreen}
            options={{ 
              headerShown: true, 
              title: 'Checkout',
            }}
          />
          <Stack.Screen 
            name="Notifications" 
            component={NotificationsScreen}
            options={{ 
              headerShown: true, 
              title: 'Notifications',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  )
}

export default RootNavigator