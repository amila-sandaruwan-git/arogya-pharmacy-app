import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Image,
  FlatList,
  Modal,
  Switch,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../../context/AuthContext'
import { ProductService } from '../../services/product.service'
import { Product, ProductColor } from '../../types'

export default function AddItemsScreen() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'published' | 'unpublished'>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: '',
    colors: [] as ProductColor[],
    images: [] as string[],
    is_published: false,
  })

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    requestPermissions()
  }, [])

  const requestPermissions = async () => {
    try {
      if (Platform.OS !== 'web') {
        await ImagePicker.requestCameraPermissionsAsync()
        await ImagePicker.requestMediaLibraryPermissionsAsync()
      }
    } catch (error) {
      console.error('Permission error:', error)
    }
  }

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const data = await ProductService.getProducts({ 
        pharmacistId: user?.id,
        isPublished: undefined 
      })
      setProducts(data)
      filterProducts(data, searchQuery, filter)
    } catch (error) {
      Alert.alert('Error', 'Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }

  const filterProducts = (data: Product[], search: string, filterType: string) => {
    let filtered = [...data]
    
    if (search) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    if (filterType === 'published') {
      filtered = filtered.filter(p => p.is_published)
    } else if (filterType === 'unpublished') {
      filtered = filtered.filter(p => !p.is_published)
    }
    
    setFilteredProducts(filtered)
  }

  const handleSearch = (text: string) => {
    setSearchQuery(text)
    filterProducts(products, text, filter)
  }

  const handleFilterChange = (type: 'all' | 'published' | 'unpublished') => {
    setFilter(type)
    filterProducts(products, searchQuery, type)
  }

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photos')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.5,
    })

    if (!result.canceled) {
      const images = result.assets.map(asset => asset.uri)
      console.log('📷 Selected images:', images)
      setFormData({ ...formData, images: [...formData.images, ...images] })
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...formData.images]
    newImages.splice(index, 1)
    setFormData({ ...formData, images: newImages })
  }

  const addColor = () => {
    const newColor: ProductColor = {
      name: '',
      hex: '#2C7A7B',
      stock: 0,
    }
    setFormData({
      ...formData,
      colors: [...formData.colors, newColor]
    })
  }

  const updateColor = (index: number, field: keyof ProductColor, value: any) => {
    const newColors = [...formData.colors]
    newColors[index] = { ...newColors[index], [field]: value }
    setFormData({ ...formData, colors: newColors })
  }

  const removeColor = (index: number) => {
    const newColors = [...formData.colors]
    newColors.splice(index, 1)
    setFormData({ ...formData, colors: newColors })
  }

  const handleSave = async (publish: boolean) => {
    if (!formData.name || !formData.price || !formData.quantity) {
      Alert.alert('Validation Error', 'Please fill all required fields')
      return
    }

    if (parseFloat(formData.price) <= 0) {
      Alert.alert('Validation Error', 'Price must be greater than 0')
      return
    }

    if (parseInt(formData.quantity) < 0) {
      Alert.alert('Validation Error', 'Quantity cannot be negative')
      return
    }

    setIsSaving(true)
    try {
      // ✅ Generate placeholder image with product name
      const placeholderImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=2C7A7B&color=fff&size=300`

      console.log('📷 Saving product with image:', placeholderImage)

      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        category: formData.category,
        colors: formData.colors,
        images: [placeholderImage],
        is_published: publish,
        pharmacist_id: user?.id || '',
        is_popular: false,
      }

      let savedProduct: Product

      if (editingProduct) {
        savedProduct = await ProductService.updateProduct(editingProduct.id, productData)
      } else {
        savedProduct = await ProductService.createProduct(productData)
      }

      console.log('✅ Product saved:', savedProduct.id)
      console.log('📷 Saved image URL:', savedProduct.images?.[0])

      Alert.alert('Success', editingProduct ? 'Product updated successfully' : 'Product created successfully')
      resetForm()
      await loadProducts()
      setShowModal(false)
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save product')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (product: Product) => {
    console.log('📝 Editing product:', product.id)
    console.log('📷 Current image URL:', product.images?.[0])
    
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      category: product.category || '',
      colors: product.colors || [],
      images: product.images || [],
      is_published: product.is_published,
    })
    setShowModal(true)
  }

  const handleDelete = async (productId: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ProductService.deleteProduct(productId)
              await loadProducts()
              Alert.alert('Success', 'Product deleted successfully')
            } catch (error) {
              Alert.alert('Error', 'Failed to delete product')
            }
          }
        }
      ]
    )
  }

  const handleTogglePublish = async (productId: string) => {
    try {
      await ProductService.togglePublish(productId)
      await loadProducts()
    } catch (error) {
      Alert.alert('Error', 'Failed to update product status')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      quantity: '',
      category: '',
      colors: [],
      images: [],
      is_published: false,
    })
    setEditingProduct(null)
  }

  // ✅ Helper function to get valid image URL with cache busting
  const getValidImageUrl = (images: any[], productName: string): string => {
    console.log('🔍 Getting image for:', productName)
    console.log('🔍 Images array:', JSON.stringify(images))
    
    // Check if images is a valid array
    if (Array.isArray(images) && images.length > 0) {
      const firstImage = images[0]
      console.log('🔍 First image value:', firstImage)
      
      if (typeof firstImage === 'string' && firstImage.startsWith('http')) {
        // ✅ Add cache-busting parameter
        const urlWithCache = firstImage + '&t=' + Date.now()
        console.log('🔍 Final URL with cache busting:', urlWithCache)
        return urlWithCache
      }
    }
    
    // Fallback to UI Avatars
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(productName)}&background=2C7A7B&color=fff&size=80&t=${Date.now()}`
    console.log('🔍 Using fallback URL:', fallbackUrl)
    return fallbackUrl
  }

  const ProductCard = ({ item }: { item: Product }) => {
    const imageUrl = getValidImageUrl(item.images, item.name)

    return (
      <View style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        padding: 12,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}>
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: 80,
            height: 80,
            borderRadius: 8,
            backgroundColor: '#EDF2F7',
          }}
          onError={(e) => {
            console.log('❌ Image load error for:', item.name)
            console.log('❌ URL that failed:', imageUrl)
          }}
          onLoad={() => {
            console.log('✅ Image loaded successfully for:', item.name)
          }}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A202C' }}>
            {item.name}
          </Text>
          <Text style={{ fontSize: 14, color: '#2C7A7B', fontWeight: 'bold' }}>
            Rs {item.price.toFixed(2)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <View style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 10,
              backgroundColor: item.is_published ? '#C6F6D5' : '#FED7D7',
            }}>
              <Text style={{
                fontSize: 10,
                fontWeight: '600',
                color: item.is_published ? '#276749' : '#9B2C2C',
              }}>
                {item.is_published ? 'Published' : 'Unpublished'}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#718096', marginLeft: 8 }}>
              Stock: {item.quantity}
            </Text>
            {Array.isArray(item.images) && item.images.length > 0 && (
              <Text style={{ fontSize: 10, color: '#A0AEC0', marginLeft: 8 }}>
                📷 {item.images.length}
              </Text>
            )}
          </View>
        </View>
        <View style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <TouchableOpacity onPress={() => handleEdit(item)}>
            <Ionicons name="pencil" size={20} color="#2C7A7B" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleTogglePublish(item.id)}>
            <Ionicons 
              name={item.is_published ? 'eye-off' : 'eye'} 
              size={20} 
              color="#2C7A7B" 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash" size={20} color="#E53E3E" />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2C7A7B" />
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7FAFC' }}>
      {/* Header */}
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
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1A202C' }}>
          📦 Manage Products
        </Text>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#2C7A7B',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
          onPress={() => {
            resetForm()
            setShowModal(true)
          }}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 4 }}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
      }}>
        <Ionicons name="search" size={20} color="#A0AEC0" />
        <TextInput
          style={{ flex: 1, marginLeft: 8, fontSize: 16 }}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Filters */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginTop: 12,
        gap: 8,
      }}>
        {['all', 'published', 'unpublished'].map((type) => (
          <TouchableOpacity
            key={type}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: filter === type ? '#2C7A7B' : '#EDF2F7',
            }}
            onPress={() => handleFilterChange(type as any)}
          >
            <Text style={{
              fontSize: 14,
              color: filter === type ? '#fff' : '#4A5568',
              fontWeight: filter === type ? '600' : '400',
            }}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => <ProductCard item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Ionicons name="cube-outline" size={64} color="#CBD5E0" />
            <Text style={{ fontSize: 16, color: '#A0AEC0', marginTop: 12 }}>
              No products found
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 16,
                backgroundColor: '#2C7A7B',
                paddingHorizontal: 24,
                paddingVertical: 10,
                borderRadius: 8,
              }}
              onPress={() => {
                resetForm()
                setShowModal(true)
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>
                Add Your First Product
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#E2E8F0',
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1A202C' }}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color="#2D3748" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <View style={{ padding: 16 }}>
              {/* Product Name */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#4A5568', marginBottom: 4 }}>
                  Product Name *
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    backgroundColor: '#F7FAFC',
                  }}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter product name"
                />
              </View>

              {/* Description */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#4A5568', marginBottom: 4 }}>
                  Description
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    backgroundColor: '#F7FAFC',
                    minHeight: 80,
                    textAlignVertical: 'top',
                  }}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Enter product description"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Price & Quantity */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#4A5568', marginBottom: 4 }}>
                    Price * (Rs)
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      backgroundColor: '#F7FAFC',
                    }}
                    value={formData.price}
                    onChangeText={(text) => setFormData({ ...formData, price: text })}
                    placeholder="0.00"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#4A5568', marginBottom: 4 }}>
                    Quantity *
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      backgroundColor: '#F7FAFC',
                    }}
                    value={formData.quantity}
                    onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Category */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#4A5568', marginBottom: 4 }}>
                  Category
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    backgroundColor: '#F7FAFC',
                  }}
                  value={formData.category}
                  onChangeText={(text) => setFormData({ ...formData, category: text })}
                  placeholder="e.g., Pain Relief, Vitamins"
                />
              </View>

              {/* Images - Preview only */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#4A5568', marginBottom: 4 }}>
                  Images (Preview Only)
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {formData.images.map((image, index) => {
                      // ✅ For preview, use the local URI directly
                      const previewUrl = image.startsWith('http') ? image : image
                      console.log('📷 Preview image:', index, previewUrl)
                      return (
                        <View key={index} style={{ position: 'relative' }}>
                          <Image
                            source={{ uri: previewUrl }}
                            style={{
                              width: 80,
                              height: 80,
                              borderRadius: 8,
                              backgroundColor: '#EDF2F7',
                            }}
                            onError={() => console.log('❌ Image load error for preview:', index)}
                            onLoad={() => console.log('✅ Preview image loaded:', index)}
                          />
                          <TouchableOpacity
                            style={{
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              backgroundColor: '#fff',
                              borderRadius: 12,
                            }}
                            onPress={() => removeImage(index)}
                          >
                            <Ionicons name="close-circle" size={24} color="#E53E3E" />
                          </TouchableOpacity>
                        </View>
                      )
                    })}
                    <TouchableOpacity
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: '#E2E8F0',
                        borderStyle: 'dashed',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#F7FAFC',
                      }}
                      onPress={pickImages}
                    >
                      <Ionicons name="camera" size={32} color="#CBD5E0" />
                      <Text style={{ fontSize: 10, color: '#A0AEC0', marginTop: 4 }}>
                        Add Images
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
                <Text style={{ fontSize: 11, color: '#718096', marginTop: 8 }}>
                  ⚠️ Images are for preview only. Product will use placeholder images.
                </Text>
              </View>

              {/* Colors */}
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#4A5568' }}>
                    Colors & Variants
                  </Text>
                  <TouchableOpacity onPress={addColor}>
                    <Text style={{ color: '#2C7A7B', fontWeight: '600' }}>+ Add Color</Text>
                  </TouchableOpacity>
                </View>
                {formData.colors.map((color, index) => (
                  <View key={index} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                  }}>
                    <TextInput
                      style={{
                        flex: 2,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        fontSize: 14,
                        backgroundColor: '#F7FAFC',
                      }}
                      value={color.name}
                      onChangeText={(text) => updateColor(index, 'name', text)}
                      placeholder="Color name"
                    />
                    <TouchableOpacity
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: color.hex || '#2C7A7B',
                        borderWidth: 2,
                        borderColor: '#E2E8F0',
                      }}
                      onPress={() => {
                        // Color picker could be added here
                      }}
                    />
                    <TextInput
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        fontSize: 14,
                        backgroundColor: '#F7FAFC',
                      }}
                      value={color.stock.toString()}
                      onChangeText={(text) => updateColor(index, 'stock', parseInt(text) || 0)}
                      placeholder="Stock"
                      keyboardType="numeric"
                    />
                    <TouchableOpacity onPress={() => removeColor(index)}>
                      <Ionicons name="close" size={24} color="#E53E3E" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Publish Status */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                borderTopWidth: 1,
                borderTopColor: '#E2E8F0',
                marginBottom: 16,
              }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#4A5568' }}>
                  Publish Product
                </Text>
                <Switch
                  value={formData.is_published}
                  onValueChange={(value) => setFormData({ ...formData, is_published: value })}
                  trackColor={{ false: '#E2E8F0', true: '#2C7A7B' }}
                />
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 40 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                    backgroundColor: '#EDF2F7',
                  }}
                  onPress={resetForm}
                >
                  <Text style={{ color: '#4A5568', fontWeight: '600' }}>Clean</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                    backgroundColor: '#2C7A7B',
                  }}
                  onPress={() => handleSave(true)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '600' }}>
                      {editingProduct ? 'Update' : 'Publish'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}