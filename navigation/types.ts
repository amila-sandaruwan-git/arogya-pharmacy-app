import type { RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

export type RootStackParamList = {
  // Auth Screens
  Auth: undefined
  Login: undefined
  OTPVerification: { phoneNumber: string }
  
  // User Screens
  User: undefined
  Home: undefined
  Cart: undefined
  Deliveries: undefined
  Profile: undefined
  Notifications: undefined
  Chat: undefined
  ProductDetail: { productId: string }
  Checkout: undefined  // ✅ Add this
  
  // Pharmacist Screens
  Pharmacist: undefined
  Dashboard: undefined
  AddItems: undefined
  Orders: undefined
  Messages: undefined
  
}

export type AuthStackParamList = {
  Login: undefined
  OTPVerification: { phoneNumber: string }
}

export type UserTabParamList = {
  Home: undefined
  Cart: undefined
  Deliveries: undefined
  Profile: undefined
}

export type PharmacistTabParamList = {
  Dashboard: undefined
  AddItems: undefined
  Orders: undefined
  Messages: undefined
  Profile: undefined
}

// Navigation prop types for screens
export type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>
export type OTPVerificationScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OTPVerification'>
export type OTPVerificationScreenRouteProp = RouteProp<AuthStackParamList, 'OTPVerification'>

// User screen navigation props
export type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>
export type CartScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Cart'>
export type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>
export type DeliveriesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Deliveries'>
export type ProductDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductDetail'>
export type ProductDetailScreenRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>
export type ChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>
export type CheckoutScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Checkout'>

// Pharmacist screen navigation props
export type PharmacistHomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>
export type AddItemsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddItems'>
export type PharmacistOrdersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Orders'>
export type PharmacistMessagesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Messages'>