import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AuthStackParamList } from './types'
import LoginScreen from '../app/(auth)/login'
import OTPVerificationScreen from '../app/(auth)/otp-verification'

const Stack = createNativeStackNavigator<AuthStackParamList>()

const AuthStack: React.FC = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
    </Stack.Navigator>
  )
}

export default AuthStack