import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRoute, useNavigation } from '@react-navigation/native'
import { ProductService } from '../../services/product.service'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { Product } from '../../types'

export default function ProductDetailScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const { productId } = route.params as { productId: string }
  const { user } = useAuth()
  const { addToCart, cartCount } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  useEffect(() => {
    loadProduct()
  }, [])

  // ✅ Hide the default navigation header
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    })
  }, [])

  const loadProduct = async () => {
    try {
      const data = await ProductService.getProductById(productId)
      setProduct(data)
      if (data.colors && data.colors.length > 0) {
        setSelectedColor(data.colors[0].name)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load product')
      navigation.goBack()
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to add items to cart', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login' as never) }
      ])
      return
    }

    if (!product) return

    setIsAdding(true)
    try {
      await addToCart(product.id, 1, selectedColor || undefined)
      Alert.alert('Success', `${product.name} added to cart!`)
    } catch (error) {
      Alert.alert('Error', 'Failed to add to cart')
    } finally {
      setIsAdding(false)
    }
  }

  const navigateToCart = () => {
    if (!user) {
      navigation.navigate('Login' as never)
    } else {
      navigation.navigate('Cart' as never)
    }
  }

  // ✅ Get valid image URL with cache busting
  const getImageUrl = (image: string) => {
    if (image && typeof image === 'string' && image.startsWith('http')) {
      return image + '&t=' + Date.now()
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(product?.name || 'Product')}&background=2C7A7B&color=fff&size=300&t=${Date.now()}`
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC' }}>
        <ActivityIndicator size="large" color="#2C7A7B" />
      </SafeAreaView>
    )
  }

  if (!product) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC' }}>
        <Text>Product not found</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      {/* ✅ Top Bar with Back Arrow and Cart Icon */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
      }}>
        {/* ✅ Back Arrow - Left Corner */}
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={{
            padding: 8,
            marginLeft: -4,
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#2D3748" />
        </TouchableOpacity>
        
        {/* ✅ Product Name - Center */}
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#1A202C',
          flex: 1,
          textAlign: 'center',
          marginHorizontal: 8,
        }} numberOfLines={1}>
          {product.name}
        </Text>
        
        {/* ✅ Cart Icon - Right Corner */}
        <TouchableOpacity 
          onPress={navigateToCart}
          style={{
            padding: 8,
          }}
        >
          <View>
            <Ionicons name="cart-outline" size={24} color="#2D3748" />
            {cartCount > 0 && (
              <View style={{
                position: 'absolute',
                top: -4,
                right: -4,
                backgroundColor: '#E53E3E',
                borderRadius: 10,
                minWidth: 18,
                height: 18,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 4,
              }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Images */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={{ backgroundColor: '#fff' }}
        >
          {product.images && product.images.length > 0 ? (
            product.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: getImageUrl(image) }}
                style={{ width: 350, height: 300, resizeMode: 'cover' }}
                onError={() => console.log('❌ Detail image error for:', index)}
                onLoad={() => console.log('✅ Detail image loaded:', index)}
              />
            ))
          ) : (
            <Image
              source={{ uri: getImageUrl('') }}
              style={{ width: 350, height: 300 }}
            />
          )}
        </ScrollView>

        <View style={{ padding: 16 }}>
          {/* Product Name */}
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1A202C' }}>
            {product.name}
          </Text>

          {/* Price */}
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#2C7A7B', marginTop: 8 }}>
            Rs {product.price.toFixed(2)}
          </Text>

          {/* Stock */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Text style={{ fontSize: 14, color: product.quantity > 0 ? '#276749' : '#9B2C2C' }}>
              {product.quantity > 0 ? '✅ In Stock' : '❌ Out of Stock'}
            </Text>
            <Text style={{ fontSize: 14, color: '#718096', marginLeft: 12 }}>
              {product.quantity} units available
            </Text>
          </View>

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A202C', marginBottom: 8 }}>
                Colors
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {product.colors.map((color, index) => (
                  <TouchableOpacity
                    key={index}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      backgroundColor: selectedColor === color.name ? '#2C7A7B' : '#EDF2F7',
                      borderWidth: 1,
                      borderColor: selectedColor === color.name ? '#2C7A7B' : '#E2E8F0',
                    }}
                    onPress={() => setSelectedColor(color.name)}
                  >
                    <Text style={{
                      color: selectedColor === color.name ? '#fff' : '#4A5568',
                      fontWeight: selectedColor === color.name ? '600' : '400',
                    }}>
                      {color.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          {product.description && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A202C', marginBottom: 8 }}>
                Description
              </Text>
              <Text style={{ fontSize: 14, color: '#4A5568', lineHeight: 22 }}>
                {product.description}
              </Text>
            </View>
          )}

          {/* Category */}
          {product.category && (
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 14, color: '#718096' }}>
                Category: <Text style={{ color: '#2D3748', fontWeight: '500' }}>{product.category}</Text>
              </Text>
            </View>
          )}

          {/* Add to Cart Button */}
          <TouchableOpacity
            style={{
              backgroundColor: isAdding ? '#A0AEC0' : '#2C7A7B',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              marginTop: 24,
              flexDirection: 'row',
              justifyContent: 'center',
            }}
            onPress={handleAddToCart}
            disabled={isAdding}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="cart-outline" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
                  Add to Cart - Rs {product.price.toFixed(2)}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}