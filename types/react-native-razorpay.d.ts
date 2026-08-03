declare module 'react-native-razorpay' {
  interface RazorpayOptions {
    description: string
    image?: string
    currency: string
    key: string
    amount: number // in paise
    name: string
    order_id?: string
    prefill?: {
      email?: string
      contact?: string
      name?: string
    }
    theme?: {
      color?: string
    }
    modal?: {
      backdrop?: boolean
    }
  }

  interface RazorpayResponse {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
  }

  interface RazorpayError {
    code: string
    description: string
    source: string
    step: string
    reason: string
    metadata: any
  }

  const RazorpayCheckout: {
    open: (options: RazorpayOptions) => Promise<RazorpayResponse>
  }

  export default RazorpayCheckout
}