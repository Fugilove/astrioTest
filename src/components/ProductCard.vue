<template>
  <v-card 
    class="product-card" 
    elevation="0"
    @click="goToProduct($event)"
  >
    <div class="image-wrapper">
      <v-img
        :src="displayImage"
        :alt="product.title"
        height="320"
        cover
        class="product-image"
      >
        <template v-slot:placeholder>
          <div class="d-flex align-center justify-center fill-height image-placeholder">
            <v-progress-circular
              color="primary"
              indeterminate
            ></v-progress-circular>
          </div>
        </template>
        <div class="image-overlay"></div>
      </v-img>
      <div class="product-badge" v-if="product.type === 'configurable'">
        <v-chip size="small" color="primary" variant="flat" class="configurable-badge">
          Настраиваемый
        </v-chip>
      </div>
    </div>

    <v-card-title class="product-title">{{ product.title }}</v-card-title>

    <v-card-subtitle class="brand-name">
      {{ brandName }}
    </v-card-subtitle>

    <v-card-text class="product-content">
      <div class="price-container">
        <span class="price">
          {{ formatPrice(product.regular_price) }}
        </span>
      </div>

      <!-- Опции для настраиваемых товаров -->
      <div v-if="product.type === 'configurable'" class="configurable-options">
        <div v-for="option in product.configurable_options" :key="option.attribute_id" class="option-group">
          <div class="option-label">{{ option.label }}:</div>
          <div class="option-buttons">
            <v-chip
              v-for="value in option.values"
              :key="value.value_index"
              color="primary"
              :variant="isOptionSelected(option.attribute_code, value.value_index) ? 'flat' : 'outlined'"
              size="small"
              @click.stop="selectOption(option.attribute_code, value.value_index)"
              class="option-chip"
            >
              {{ value.label }}
            </v-chip>
          </div>
        </div>

        <div v-if="selectedVariant" class="variant-badge">
          Выбран вариант: {{ selectedVariant.product?.sku || selectedVariant.sku || 'Доступен' }}
        </div>
      </div>
    </v-card-text>

    <v-card-actions class="product-actions">
      <v-btn
        color="primary"
        variant="flat"
        block
        :disabled="!canAddToCart"
        @click="addToCart($event)"
        class="add-to-cart-btn"
        size="large"
      >
        <v-icon v-if="canAddToCart" start>mdi-cart-plus</v-icon>
        <v-icon v-else start>mdi-alert-circle</v-icon>
        <span v-if="canAddToCart">В корзину</span>
        <span v-else>Данный товар нельзя добавить</span>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useProductsStore } from '../stores/products'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const cartStore = useCartStore()
const productsStore = useProductsStore()

const selectedOptions = ref({})

const goToProduct = (event) => {
  // Проверяем, что клик не был на интерактивных элементах
  const target = event.target
  const isInteractiveElement = target.closest('.add-to-cart-btn') || 
                               target.closest('.v-btn') ||
                               target.closest('.option-chip') ||
                               target.closest('.v-chip') ||
                               target.closest('.configurable-options') ||
                               target.closest('.product-actions')
  
  if (!isInteractiveElement) {
    // Используем текущий продукт из props, чтобы гарантировать правильный переход
    const currentProduct = props.product
    if (currentProduct && currentProduct.id !== undefined) {
      // Используем точный ID из текущего продукта
      const productId = Number(currentProduct.id)
      router.push(`/product/${productId}`)
    }
  }
}

const brandName = computed(() => {
  const brand = productsStore.getBrandById(props.product.brand)
  return brand ? brand.title : 'Неизвестный бренд'
})

const displayImage = computed(() => {
  if (props.product.type === 'configurable' && selectedVariant.value) {
    // Поддержка двух форматов: с product.image и с прямым image
    const variantImage = selectedVariant.value.product?.image || selectedVariant.value.image
    return variantImage || props.product.image
  }
  return props.product.image
})

const selectedVariant = computed(() => {
  if (props.product.type !== 'configurable' || !props.product.variants) {
    return null
  }

  const selectedValues = Object.values(selectedOptions.value)
  if (selectedValues.length !== props.product.configurable_options.length) {
    return null
  }

  return props.product.variants.find(variant => {
    // Поддержка двух форматов: с массивом attributes и с прямыми свойствами
    if (variant.attributes && Array.isArray(variant.attributes)) {
      return variant.attributes.every(attr => {
        const selectedValue = selectedOptions.value[attr.code]
        return attr.value_index === selectedValue
      })
    } else {
      return props.product.configurable_options.every(option => {
        const selectedValue = selectedOptions.value[option.attribute_code]
        return variant[option.attribute_code] === selectedValue
      })
    }
  })
})

const canAddToCart = computed(() => {
  if (props.product.type === 'simple') {
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
  event.stopPropagation() // Предотвращаем переход на страницу товара
  if (props.product.type === 'simple') {
    cartStore.addItem(props.product)
    triggerAddToCartAnimation(event)
  } else if (selectedVariant.value) {
    cartStore.addItem(props.product, { ...selectedOptions.value })
    triggerAddToCartAnimation(event)
  }
}

const triggerAddToCartAnimation = (event) => {
  // Получаем позицию изображения товара
  const cardElement = event.currentTarget.closest('.product-card')
  const imageElement = cardElement?.querySelector('.v-img__img, .product-image img, .v-img')
  
  let imageRect = null
  if (imageElement) {
    imageRect = imageElement.getBoundingClientRect()
  } else {
    // Fallback на позицию карточки
    const cardRect = cardElement?.getBoundingClientRect()
    if (cardRect) {
      imageRect = {
        left: cardRect.left,
        top: cardRect.top,
        width: cardRect.width,
        height: cardRect.width * 0.8 // Примерное соотношение
      }
    }
  }
  
  // Отправляем событие для анимации
  if (imageRect && typeof window !== 'undefined') {
    const customEvent = new CustomEvent('add-to-cart', {
      detail: {
        product: props.product,
        image: displayImage.value,
        startRect: imageRect
      }
    })
    window.dispatchEvent(customEvent)
  }
}

// Сброс опций при изменении продукта
watch(() => props.product.id, () => {
  selectedOptions.value = {}
})
</script>

<style scoped>
.product-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 0;
  overflow: hidden;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
  width: 100%;
  min-width: 280px;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #cbd5e1;
}

.image-wrapper {
  position: relative;
  overflow: hidden;
  background: #f8fafc;
}

.product-image {
  width: 100%;
  min-height: 320px;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  object-fit: cover;
}

.product-card:hover .product-image {
  transform: scale(1.1);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.product-card:hover .image-overlay {
  opacity: 1;
}

.image-placeholder {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.product-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
}

.product-title {
  font-size: 1.125rem !important;
  font-weight: 600 !important;
  line-height: 1.4 !important;
  color: #1e293b !important;
  padding: 16px 16px 4px 16px !important;
  min-height: auto !important;
}

.brand-name {
  color: #64748b !important;
  font-size: 0.875rem !important;
  font-weight: 500 !important;
  padding: 0 16px 8px 16px !important;
  opacity: 0.8;
}

.product-content {
  padding: 8px 16px 16px 16px !important;
  flex-grow: 1;
}

.price-container {
  margin-bottom: 12px;
}

.price {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.5px;
}

.configurable-options {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.option-group {
  margin-bottom: 16px;
}

.option-label {
  font-weight: 600;
  margin-bottom: 10px;
  display: block;
  font-size: 0.875rem;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.option-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.option-chip {
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.option-chip:hover {
  transform: scale(1.05);
}

.variant-badge {
  margin-top: 12px;
  padding: 10px 12px;
  background: #f1f5f9;
  border-radius: 0;
  font-size: 0.8125rem;
  color: #1e293b;
  font-weight: 600;
  border: 1px solid #e2e8f0;
}

.configurable-badge {
  background: #000000 !important;
  color: #ffffff !important;
}

.product-actions {
  padding: 12px 16px 20px 16px !important;
  margin-top: auto;
}

.add-to-cart-btn {
  border-radius: 0 !important;
  font-weight: 600 !important;
  text-transform: none !important;
  letter-spacing: 0.3px;
  box-shadow: none !important;
  transition: all 0.2s ease !important;
  white-space: normal !important;
  word-wrap: break-word !important;
  line-height: 1.3 !important;
  padding: 12px 8px !important;
  min-height: 48px !important;
  height: auto !important;
}

.add-to-cart-btn :deep(.v-btn__content) {
  flex-wrap: wrap;
  text-align: center;
  width: 100%;
}

.add-to-cart-btn :deep(span) {
  display: block;
  width: 100%;
  font-size: 0.875rem;
  line-height: 1.4;
  padding: 0 4px;
  word-break: break-word;
}

.add-to-cart-btn:hover {
  opacity: 0.9;
}

.add-to-cart-btn:active {
  transform: translateY(0);
}

.add-to-cart-btn:disabled {
  opacity: 0.6;
  transform: none !important;
  cursor: not-allowed;
  background-color: #e2e8f0 !important;
  color: #64748b !important;
}
</style>

