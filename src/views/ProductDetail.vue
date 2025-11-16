<template>
  <div class="product-detail-container">
    <v-btn
      icon
      variant="text"
      class="back-btn"
      @click="$router.back()"
    >
      <v-icon>mdi-arrow-left</v-icon>
    </v-btn>

    <v-card class="product-detail-card" v-if="product">
      <v-row no-gutters>
        <!-- Изображение товара -->
        <v-col cols="12" md="6">
          <div class="product-image-section">
            <v-img
              :src="displayImage"
              :alt="product.title"
              cover
              class="product-detail-image"
              height="600"
            >
              <template v-slot:placeholder>
                <div class="d-flex align-center justify-center fill-height">
                  <v-progress-circular
                    color="primary"
                    indeterminate
                  ></v-progress-circular>
                </div>
              </template>
            </v-img>
          </div>
        </v-col>

        <!-- Информация о товаре -->
        <v-col cols="12" md="6">
          <div class="product-info-section">
            <div class="product-header">
              <div class="brand-badge">{{ brandName }}</div>
              <h1 class="product-title">{{ product.title }}</h1>
              <div class="product-sku">Артикул: {{ product.sku }}</div>
            </div>

            <v-divider class="my-6"></v-divider>

            <div class="price-section">
              <div class="price-label">Цена</div>
              <div class="price-value">
                {{ formatPrice(product.regular_price) }}
              </div>
            </div>

            <!-- Опции для настраиваемых товаров -->
            <div v-if="product.type === 'configurable'" class="options-section">
              <v-divider class="my-6"></v-divider>
              
              <div
                v-for="option in product.configurable_options"
                :key="option.attribute_id"
                class="option-group"
              >
                <div class="option-label">{{ option.label }}</div>
                <div class="option-buttons">
                  <button
                    v-for="value in option.values"
                    :key="value.value_index"
                    :class="[
                      'option-button',
                      { active: isOptionSelected(option.attribute_code, value.value_index) }
                    ]"
                    @click="selectOption(option.attribute_code, value.value_index)"
                  >
                    {{ value.label }}
                  </button>
                </div>
              </div>

              <div v-if="selectedVariant" class="variant-info">
                <v-chip color="primary" variant="flat" size="small">
                  Вариант доступен: {{ selectedVariant.product?.sku || selectedVariant.sku }}
                </v-chip>
              </div>
            </div>

            <v-divider class="my-6"></v-divider>

            <!-- Кнопка добавления в корзину -->
            <div class="actions-section">
              <v-btn
                color="primary"
                variant="flat"
                size="x-large"
                block
                :disabled="!canAddToCart"
                @click="addToCart($event)"
                class="add-to-cart-btn"
              >
                <v-icon v-if="canAddToCart" start>mdi-cart-plus</v-icon>
                <v-icon v-else start>mdi-alert-circle</v-icon>
                <span v-if="canAddToCart">Добавить в корзину</span>
                <span v-else>Данный товар нельзя добавить</span>
              </v-btn>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card>

    <div v-else class="loading-container">
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
      ></v-progress-circular>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useProductsStore } from '../stores/products'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const productsStore = useProductsStore()

const product = ref(null)
const selectedOptions = ref({})

const brandName = computed(() => {
  if (!product.value) return ''
  const brand = productsStore.getBrandById(product.value.brand)
  return brand ? brand.title : 'Неизвестный бренд'
})

const displayImage = computed(() => {
  if (!product.value) return ''
  if (product.value.type === 'configurable' && selectedVariant.value) {
    const variantImage = selectedVariant.value.product?.image || selectedVariant.value.image
    return variantImage || product.value.image
  }
  return product.value.image
})

const selectedVariant = computed(() => {
  if (!product.value || product.value.type !== 'configurable' || !product.value.variants) {
    return null
  }

  const selectedValues = Object.values(selectedOptions.value)
  if (selectedValues.length !== product.value.configurable_options.length) {
    return null
  }

  return product.value.variants.find(variant => {
    if (variant.attributes && Array.isArray(variant.attributes)) {
      return variant.attributes.every(attr => {
        const selectedValue = selectedOptions.value[attr.code]
        return attr.value_index === selectedValue
      })
    } else {
      return product.value.configurable_options.every(option => {
        const selectedValue = selectedOptions.value[option.attribute_code]
        return variant[option.attribute_code] === selectedValue
      })
    }
  })
})

const canAddToCart = computed(() => {
  if (!product.value) return false
  if (product.value.type === 'simple') {
    return true
  }
  return selectedVariant.value !== null
})

const formatPrice = (price) => {
  return `${price.value.toFixed(2)} ${price.currency}`
}

const isOptionSelected = (attributeCode, valueIndex) => {
  return selectedOptions.value[attributeCode] === valueIndex
}

const selectOption = (attributeCode, valueIndex) => {
  if (selectedOptions.value[attributeCode] === valueIndex) {
    delete selectedOptions.value[attributeCode]
  } else {
    selectedOptions.value[attributeCode] = valueIndex
  }
}

const addToCart = (event) => {
  if (product.value.type === 'simple') {
    cartStore.addItem(product.value)
    triggerAddToCartAnimation(event)
  } else if (selectedVariant.value) {
    cartStore.addItem(product.value, { ...selectedOptions.value })
    triggerAddToCartAnimation(event)
  }
}

const triggerAddToCartAnimation = (event) => {
  const cardElement = event.currentTarget.closest('.product-detail-card')
  const imageElement = cardElement?.querySelector('.product-detail-image')
  
  let imageRect = null
  if (imageElement) {
    imageRect = imageElement.getBoundingClientRect()
  }
  
  if (imageRect && typeof window !== 'undefined') {
    const customEvent = new CustomEvent('add-to-cart', {
      detail: {
        product: product.value,
        image: displayImage.value,
        startRect: imageRect
      }
    })
    window.dispatchEvent(customEvent)
  }
}

const loadProduct = async (productId) => {
  // Убеждаемся, что продукты загружены
  if (!productsStore.level3Loaded) {
    await productsStore.loadLevel3Products()
  }
  
  // Ищем товар по ID - используем точное сравнение
  const productIdNum = Number(productId)
  const foundProduct = productsStore.products.find(p => {
    return Number(p.id) === productIdNum
  })
  
  if (foundProduct) {
    // Создаем глубокую копию для реактивности
    product.value = JSON.parse(JSON.stringify(foundProduct))
    selectedOptions.value = {} // Сбрасываем выбранные опции
  } else {
    // Если товар не найден, пробуем загрузить Level 3 еще раз
    await productsStore.loadLevel3Products()
    const retryProduct = productsStore.products.find(p => {
      return Number(p.id) === productIdNum
    })
    if (retryProduct) {
      product.value = JSON.parse(JSON.stringify(retryProduct))
      selectedOptions.value = {}
    } else {
      router.push('/')
    }
  }
}

onMounted(async () => {
  const productId = parseInt(route.params.id)
  await loadProduct(productId)
})

// Отслеживаем изменения маршрута
watch(() => route.params.id, async (newId) => {
  if (newId) {
    const productId = parseInt(newId)
    await loadProduct(productId)
  }
})
</script>

<style scoped>
.product-detail-container {
  padding: 32px 24px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 80px);
  position: relative;
}

.back-btn {
  margin-bottom: 24px;
  color: #1e293b;
}

.product-detail-card {
  border-radius: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.product-image-section {
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 600px;
}

.product-detail-image {
  width: 100%;
  object-fit: cover;
}

.product-info-section {
  padding: 48px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.product-header {
  margin-bottom: 24px;
}

.brand-badge {
  display: inline-block;
  padding: 6px 12px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
  border-radius: 4px;
}

.product-title {
  font-size: 2rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.3;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.product-sku {
  font-size: 0.875rem;
  color: #94a3b8;
  font-weight: 400;
}

.price-section {
  margin: 24px 0;
}

.price-label {
  font-size: 0.875rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  margin-bottom: 8px;
}

.price-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -1px;
}

.options-section {
  margin: 24px 0;
}

.option-group {
  margin-bottom: 32px;
}

.option-label {
  font-size: 0.875rem;
  color: #1e293b;
  font-weight: 600;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.option-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.option-button {
  min-width: 48px;
  height: 48px;
  padding: 0 20px;
  border: 2px solid #000000;
  background: white;
  color: #000000;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.option-button:hover {
  border-color: #000000;
  background: #f8fafc;
}

.option-button.active {
  border-color: #000000;
  background: #000000;
  color: white;
}

.variant-info {
  margin-top: 16px;
}

.actions-section {
  margin-top: auto;
  padding-top: 24px;
}

.add-to-cart-btn {
  border-radius: 0 !important;
  font-weight: 600 !important;
  text-transform: none !important;
  letter-spacing: 0.3px;
  min-height: 56px;
  height: auto !important;
  white-space: normal !important;
  word-wrap: break-word !important;
  line-height: 1.3 !important;
  padding: 16px 12px !important;
}

.add-to-cart-btn :deep(.v-btn__content) {
  flex-wrap: wrap;
  text-align: center;
  width: 100%;
}

.add-to-cart-btn :deep(span) {
  display: block;
  width: 100%;
  font-size: 0.9375rem;
  line-height: 1.4;
  padding: 0 4px;
}

.add-to-cart-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #e2e8f0 !important;
  color: #64748b !important;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

@media (max-width: 960px) {
  .product-info-section {
    padding: 32px 24px;
  }

  .product-title {
    font-size: 1.75rem;
  }

  .price-value {
    font-size: 2rem;
  }
}

@media (max-width: 600px) {
  .product-detail-container {
    padding: 16px;
  }

  .product-info-section {
    padding: 24px 16px;
  }

  .product-image-section {
    min-height: 400px;
  }
}
</style>

