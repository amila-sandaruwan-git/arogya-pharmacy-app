import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  SafeAreaView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { ProductService } from '../../services/product.service'
import { NotificationService } from '../../services/notification.service'
import { supabase } from '../../config/supabase'
import { Product } from '../../types'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../navigation/types'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

const categories = [
  { id: 'all', name: 'All' },
  { id: 'pain-relief', name: 'Pain Relief' },
  { id: 'vitamins', name: 'Vitamins' },
  { id: 'skin-care', name: 'Skin Care' },
  { id: 'digestive', name: 'Digestive' },
  { id: 'respiratory', name: 'Respiratory' },
  { id: 'ayurvedic', name: 'Ayurvedic' },
]

export default function HomeScreen() {
  const { user } = useAuth()
  const { cartCount, addToCart } = useCart()
  const navigation = useNavigation<NavigationProp>()
  const [products, setProducts] = useState<Product[]>([])
  const [popularItems, setPopularItems] = useState<Product[]>([])
  const [newItems, setNewItems] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [isAdding, setIsAdding] = useState<string | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)
  const [subscription, setSubscription] = useState<any>(null)
  const scrollViewRef = useRef<ScrollView>(null)
  const searchInputRef = useRef<TextInput>(null)

  // Load data and setup subscriptions
  useEffect(() => {
    loadData()
    if (user) {
      loadNotificationCount()
      setupNotificationSubscription()
    }
    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [user])

  // =============================================
  // NOTIFICATION FUNCTIONS
  // =============================================

  const loadNotificationCount = async () => {
    if (!user) return
    try {
      const count = await NotificationService.getUnreadCount(user.id)
      setNotificationCount(count)
    } catch (error) {
      console.error('Error loading notification count:', error)
    }
  }

  const setupNotificationSubscription = () => {
    if (!user) return

    if (subscription) {
      subscription.unsubscribe()
    }

    const channel = supabase
      .channel(`notifications_${user.id}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setNotificationCount(prev => prev + 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadNotificationCount()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadNotificationCount()
        }
      )
      .subscribe((status) => {
        console.log('📡 Notification subscription status:', status)
      })

    setSubscription(channel)
  }

  // =============================================
  // PRODUCT LOADING FUNCTIONS
  // =============================================

  const loadData = async () => {
    setIsLoading(true)
    try {
      console.log('📦 Loading products...')
      
      const [allProducts, popular, newProducts] = await Promise.all([
        ProductService.getProducts({ isPublished: true }),
        ProductService.getPopularProducts(10),
        ProductService.getNewProducts(10)
      ])

      console.log(`📦 Products loaded: ${allProducts.length}`)
      console.log(`🔥 Popular: ${popular.length}`)
      console.log(`✨ New: ${newProducts.length}`)

      setProducts(allProducts)
      setFilteredProducts(allProducts)
      setPopularItems(popular)
      setNewItems(newProducts)
    } catch (error) {
      console.error('Error loading products:', error)
      Alert.alert('Error', 'Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    if (user) {
      await loadNotificationCount()
    }
    setRefreshing(false)
  }

  // =============================================
  // SEARCH FUNCTIONS
  // =============================================

  const handleSearch = (text: string) => {
    setSearchQuery(text)
    
    if (text.length > 0) {
      const results = products.filter(p => 
        p.name.toLowerCase().includes(text.toLowerCase())
      )
      setSearchResults(results)
      setShowDropdown(true)
    } else {
      setSearchResults([])
      setShowDropdown(false)
      filterProducts('', selectedCategory)
    }
  }

  const handleSearchSubmit = () => {
    setShowDropdown(false)
    filterProducts(searchQuery, selectedCategory)
  }

  const handleSelectProduct = (product: Product) => {
    setSearchQuery(product.name)
    setShowDropdown(false)
    navigation.navigate('ProductDetail', { productId: product.id })
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setShowDropdown(false)
    filterProducts('', selectedCategory)
    searchInputRef.current?.focus()
  }

  // =============================================
  // CATEGORY & FILTER FUNCTIONS
  // =============================================

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setShowDropdown(false)
    filterProducts(searchQuery, categoryId)
  }

  const filterProducts = (search: string, category: string) => {
    let filtered = [...products]

    if (search) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (category !== 'all') {
      filtered = filtered.filter(p => p.category === category)
    }

    setFilteredProducts(filtered)
  }

  // =============================================
  // SCROLL & CART FUNCTIONS
  // =============================================

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y
    setShowScrollTop(offsetY > 400)
  }

  // ✅ Smooth scroll to top
  const scrollToTop = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: 0,
        animated: true,
      })
    }
  }

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to add items to cart', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') }
      ])
      return
    }

    setIsAdding(product.id)
    try {
      if (product.colors && product.colors.length > 0) {
        await addToCart(product.id, 1, product.colors[0].name)
      } else {
        await addToCart(product.id)
      }
      
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to cart')
    } finally {
      setIsAdding(null)
    }
  }

  // =============================================
  // RENDER FUNCTIONS
  // =============================================

  const renderDropdownItem = ({ item }: { item: Product }) => {
    // ✅ Get valid image URL
    let imageUrl = 'https://via.placeholder.com/40/EDF2F7/4A5568?text=No+Image'
    if (Array.isArray(item.images) && item.images.length > 0 && typeof item.images[0] === 'string' && item.images[0].startsWith('http')) {
      imageUrl = item.images[0]
    }

    return (
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
          backgroundColor: '#fff',
        }}
        onPress={() => handleSelectProduct(item)}
      >
        <Image
          source={{ uri: imageUrl }}
          style={{ width: 40, height: 40, borderRadius: 8, marginRight: 12 }}
          onError={() => console.log('❌ Dropdown image error for:', item.name)}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#2D3748' }}>
            {item.name}
          </Text>
          <Text style={{ fontSize: 12, color: '#2C7A7B', fontWeight: '600' }}>
            Rs {item.price.toFixed(2)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#A0AEC0" />
      </TouchableOpacity>
    )
  }

  const ProductCard = ({ item }: { item: Product }) => {
    // ✅ Get valid image URL
    let imageUrl = 'https://via.placeholder.com/160x120/EDF2F7/4A5568?text=No+Image'
    if (Array.isArray(item.images) && item.images.length > 0 && typeof item.images[0] === 'string' && item.images[0].startsWith('http')) {
      imageUrl = item.images[0]
    }

    return (
      <TouchableOpacity
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          marginRight: 12,
          width: 160,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
          overflow: 'hidden',
        }}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      >
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: '100%',
            height: 120,
            backgroundColor: '#EDF2F7',
          }}
          resizeMode="cover"
          onError={() => console.log('❌ Product image error for:', item.name)}
        />
        <View style={{ padding: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#2D3748' }} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2C7A7B', marginTop: 4 }}>
            Rs {item.price.toFixed(2)}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: isAdding === item.id ? '#A0AEC0' : '#2C7A7B',
              paddingVertical: 4,
              paddingHorizontal: 12,
              borderRadius: 16,
              alignSelf: 'flex-start',
              marginTop: 4,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => handleAddToCart(item)}
            disabled={isAdding === item.id}
          >
            {isAdding === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                Add to Cart
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )
  }

  const GridProductCard = ({ item }: { item: Product }) => {
    // ✅ Get valid image URL
    let imageUrl = 'https://via.placeholder.com/160x120/EDF2F7/4A5568?text=No+Image'
    if (Array.isArray(item.images) && item.images.length > 0 && typeof item.images[0] === 'string' && item.images[0].startsWith('http')) {
      imageUrl = item.images[0]
    }

    return (
      <TouchableOpacity
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          flex: 1,
          marginHorizontal: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
          overflow: 'hidden',
          marginBottom: 12,
        }}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      >
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: '100%',
            height: 120,
            backgroundColor: '#EDF2F7',
          }}
          resizeMode="cover"
          onError={() => console.log('❌ Grid image error for:', item.name)}
        />
        <View style={{ padding: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#2D3748' }} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2C7A7B', marginTop: 4 }}>
            Rs {item.price.toFixed(2)}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: isAdding === item.id ? '#A0AEC0' : '#2C7A7B',
              paddingVertical: 4,
              paddingHorizontal: 12,
              borderRadius: 16,
              alignSelf: 'flex-start',
              marginTop: 4,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => handleAddToCart(item)}
            disabled={isAdding === item.id}
          >
            {isAdding === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                Add to Cart
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2C7A7B" />
        <Text style={{ marginTop: 12, color: '#718096' }}>Loading products...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      {/* =============================================
          HEADER
          ============================================= */}
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
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#2C7A7B' }}>
           Arogya
        </Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {user && (
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
              <View>
                <Ionicons name="notifications-outline" size={24} color="#2D3748" />
                {notificationCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    backgroundColor: '#E53E3E',
                    borderRadius: 10,
                    minWidth: 18,
                    height: 18,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 4,
                  }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity onPress={() => {
            if (!user) {
              navigation.navigate('Login')
            } else {
              navigation.navigate('Cart')
            }
          }}>
            <View>
              <Ionicons name="cart-outline" size={24} color="#2D3748" />
              {cartCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  backgroundColor: '#E53E3E',
                  borderRadius: 10,
                  minWidth: 18,
                  height: 18,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 4,
                }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>
                    {cartCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          
          {!user ? (
            <TouchableOpacity 
              style={{
                paddingHorizontal: 16,
                paddingVertical: 6,
                backgroundColor: '#2C7A7B',
                borderRadius: 20,
              }}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Login</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Image
                source={{ uri: user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=2C7A7B&color=fff&size=40` }}
                style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#2C7A7B' }}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* =============================================
          SEARCH BAR WITH DROPDOWN
          ============================================= */}
      <View style={{ position: 'relative', zIndex: 10 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#fff',
          marginHorizontal: 16,
          marginVertical: 12,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: searchQuery ? '#2C7A7B' : '#E2E8F0',
        }}>
          <Ionicons name="search" size={20} color="#A0AEC0" />
          <TextInput
            ref={searchInputRef}
            style={{ flex: 1, marginLeft: 8, fontSize: 16 }}
            placeholder="Search medicines..."
            placeholderTextColor="#A0AEC0"
            value={searchQuery}
            onChangeText={handleSearch}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={20} color="#A0AEC0" />
            </TouchableOpacity>
          )}
        </View>

        {/* Dropdown Results */}
        {showDropdown && searchResults.length > 0 && (
          <View style={{
            position: 'absolute',
            top: 70,
            left: 16,
            right: 16,
            backgroundColor: '#fff',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            maxHeight: 300,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
            zIndex: 20,
          }}>
            <FlatList
              data={searchResults}
              renderItem={renderDropdownItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="always"
            />
          </View>
        )}

        {/* No Results Message */}
        {showDropdown && searchQuery.length > 0 && searchResults.length === 0 && (
          <View style={{
            position: 'absolute',
            top: 70,
            left: 16,
            right: 16,
            backgroundColor: '#fff',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            padding: 20,
            alignItems: 'center',
            zIndex: 20,
          }}>
            <Ionicons name="search-outline" size={32} color="#CBD5E0" />
            <Text style={{ fontSize: 14, color: '#A0AEC0', marginTop: 8 }}>
              No products found for "{searchQuery}"
            </Text>
          </View>
        )}
      </View>

      {/* =============================================
          MAIN CONTENT
          ============================================= */}
      <ScrollView
        ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Categories */}
        <View style={{ paddingVertical: 8 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: selectedCategory === category.id ? '#2C7A7B' : '#F7FAFC',
                  borderWidth: selectedCategory === category.id ? 0 : 1,
                  borderColor: '#E2E8F0',
                }}
                onPress={() => handleCategorySelect(category.id)}
              >
                <Text style={{
                  fontSize: 14,
                  color: selectedCategory === category.id ? '#fff' : '#4A5568',
                  fontWeight: selectedCategory === category.id ? '600' : '400',
                }}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Popular Items */}
        {popularItems.length > 0 && (
          <View style={{ marginVertical: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1A202C' }}>
                 Popular Items
              </Text>
            </View>
            <FlatList
              horizontal
              data={popularItems}
              renderItem={({ item }) => <ProductCard item={item} />}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
            />
          </View>
        )}

        {/* New Items */}
        {newItems.length > 0 && (
          <View style={{ marginVertical: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1A202C' }}>
                 New Arrivals
              </Text>
            </View>
            <FlatList
              horizontal
              data={newItems}
              renderItem={({ item }) => <ProductCard item={item} />}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
            />
          </View>
        )}

        {/* All Products */}
        <View style={{ marginVertical: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1A202C' }}>
              All Products
            </Text>
            <Text style={{ fontSize: 14, color: '#718096' }}>
              {filteredProducts.length} items
            </Text>
          </View>
          
          {filteredProducts.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Ionicons name="cube-outline" size={48} color="#CBD5E0" />
              <Text style={{ fontSize: 16, color: '#A0AEC0', marginTop: 8 }}>
                {searchQuery ? 'No products match your search' : 'No products available'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              renderItem={({ item }) => <GridProductCard item={item} />}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 8 }}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
            />
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* =============================================
          SCROLL TO TOP BUTTON - SMOOTH
          ============================================= */}
      {showScrollTop && (
        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            position: 'absolute',
            bottom: 110,
            right: 20,
            backgroundColor: '#2C7A7B',
            width: 48,
            height: 48,
            borderRadius: 24,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}
          onPress={scrollToTop}
        >
          <Ionicons name="arrow-up" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* =============================================
          FLOATING CHAT BUTTON
          ============================================= */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 24,
          right: 16,
          backgroundColor: '#2C7A7B',
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        }}
        onPress={() => {
          if (!user) {
            Alert.alert('Login Required', 'Please login to chat with pharmacist', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Login', onPress: () => navigation.navigate('Login') }
            ])
          } else {
            navigation.navigate('Chat')
          }
        }}
      >
        <Ionicons name="chatbubble" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  )
}