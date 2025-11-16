<template>
  <div class="cart-container">
    <v-card class="cart-card">
      <v-card-title class="cart-title">
        <v-icon size="32" class="cart-icon">mdi-cart</v-icon>
        <span>Корзина покупок</span>
      </v-card-title>

      <v-card-text>
        <div v-if="cartStore.items.length === 0" class="empty-cart">
          <div class="empty-cart-icon">
            <v-icon size="120" color="primary">mdi-cart-off</v-icon>
          </div>
          <p class="empty-cart-title">Ваша корзина пуста</p>
          <p class="empty-cart-subtitle">Добавьте товары из каталога</p>
          <v-btn 
            color="primary" 
            class="mt-6 empty-cart-btn" 
            size="large"
            @click="$router.push('/')"
          >
            <v-icon start>mdi-store</v-icon>
            Перейти к каталогу
          </v-btn>
        </div>

        <div v-else>
          <v-list>
            <v-list-item
              v-for="(item, index) in cartStore.items"
              :key="index"
              class="cart-item"
            >
              <template v-slot:prepend>
                <div class="cart-item-image-wrapper">
                  <v-img
                    :src="getItemImage(item)"
                    :alt="item.product.title"
                    width="120"
                    height="120"
                    cover
                    class="cart-item-image"
                  ></v-img>
                </div>
              </template>

              <v-list-item-title class="cart-item-title">{{ item.product.title }}</v-list-item-title>
              <v-list-item-subtitle class="cart-item-subtitle">
                <span class="brand-label">{{ productsStore.getBrandById(item.product.brand)?.title }}</span>
                <div v-if="item.selectedOptions" class="selected-options">
                  <v-chip
                    v-for="(value, key) in getSelectedOptionsLabels(item)"
                    :key="key"
                    size="small"
                    class="option-chip"
                    color="primary"
                    variant="outlined"
                    style="border-color: #000000; color: #000000;"
                  >
                    {{ key }}: {{ value }}
                  </v-chip>
                </div>
              </v-list-item-subtitle>

              <template v-slot:append>
                <div class="cart-item-actions">
                  <div class="quantity-controls">
                    <v-btn
                      icon
                      size="small"
                      variant="flat"
                      color="primary"
                      class="quantity-btn"
                      @click="decreaseQuantity(index)"
                    >
                      <v-icon>mdi-minus</v-icon>
                    </v-btn>
                    <v-text-field
                      v-model.number="item.quantity"
                      type="number"
                      min="1"
                      density="compact"
                      class="quantity-input"
                      hide-details
                      @update:model-value="updateQuantity(index, $event)"
                    ></v-text-field>
                    <v-btn
                      icon
                      size="small"
                      variant="flat"
                      color="primary"
                      class="quantity-btn"
                      @click="increaseQuantity(index)"
                    >
                      <v-icon>mdi-plus</v-icon>
                    </v-btn>
                  </div>

                  <div class="item-price">
                    {{ formatPrice(item.product.regular_price.value * item.quantity) }}
                  </div>

                  <v-btn
                    icon
                    color="primary"
                    variant="flat"
                    class="delete-btn"
                    @click="cartStore.removeItem(index)"
                  >
                    <v-icon>mdi-delete-outline</v-icon>
                  </v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>

          <v-divider class="my-4"></v-divider>

          <div class="cart-summary">
            <div class="summary-row">
              <span class="summary-label">Товаров в корзине:</span>
              <span class="summary-value">{{ cartStore.totalItems }} шт.</span>
            </div>
            <v-divider class="my-3"></v-divider>
            <div class="summary-row total-row">
              <span class="summary-total-label">Итого к оплате:</span>
              <span class="summary-total-price">
                {{ formatPrice(cartStore.totalPrice) }}
              </span>
            </div>
            <v-btn
              color="primary"
              size="x-large"
              block
              class="checkout-btn mt-4"
            >
              <v-icon start>mdi-credit-card</v-icon>
              Оформить заказ
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCartStore } from '../stores/cart'
import { useProductsStore } from '../stores/products'

const cartStore = useCartStore()
const productsStore = useProductsStore()

const getItemImage = (item) => {
  if (item.product.type === 'configurable' && item.selectedOptions) {
    const variant = item.product.variants?.find(v => {
      // Поддержка двух форматов: с массивом attributes и с прямыми свойствами
      if (v.attributes && Array.isArray(v.attributes)) {
        return v.attributes.every(attr => {
          return attr.value_index === item.selectedOptions[attr.code]
        })
      } else {
        return item.product.configurable_options.every(option => {
          return v[option.attribute_code] === item.selectedOptions[option.attribute_code]
        })
      }
    })
    const variantImage = variant?.product?.image || variant?.image
    return variantImage || item.product.image
  }
  return item.product.image
}

const getSelectedOptionsLabels = (item) => {
  if (!item.selectedOptions || item.product.type !== 'configurable') {
    return {}
  }

  const labels = {}
  item.product.configurable_options.forEach(option => {
    const valueIndex = item.selectedOptions[option.attribute_code]
    if (valueIndex) {
      const value = option.values.find(v => v.value_index === valueIndex)
      if (value) {
        labels[option.label] = value.label
      }
    }
  })
  return labels
}

const formatPrice = (value) => {
  return `${value.toFixed(2)} USD`
}

const updateQuantity = (index, quantity) => {
  cartStore.updateQuantity(index, quantity)
}

const increaseQuantity = (index) => {
  cartStore.items[index].quantity++
}

const decreaseQuantity = (index) => {
  if (cartStore.items[index].quantity > 1) {
    cartStore.items[index].quantity--
  } else {
    cartStore.removeItem(index)
  }
}
</script>

<style scoped>
.cart-container {
  padding: 32px 24px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 80px);
}

.cart-card {
  border-radius: 0 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
  overflow: hidden;
  border: 1px solid #e2e8f0 !important;
}

.cart-title {
  background: #ffffff;
  color: #1e293b !important;
  padding: 24px 32px !important;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.5rem !important;
  font-weight: 600 !important;
  border-bottom: 1px solid #e2e8f0;
}

.cart-icon {
  color: #1e293b !important;
}

.empty-cart {
  text-align: center;
  padding: 80px 24px;
}

.empty-cart-icon {
  margin-bottom: 24px;
  opacity: 0.6;
}

.empty-cart-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.empty-cart-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin-bottom: 0;
}

.empty-cart-btn {
  border-radius: 12px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3) !important;
}

.cart-item {
  border-bottom: 1px solid #e2e8f0;
  padding: 24px 0 !important;
  transition: all 0.3s;
}

.cart-item:last-child {
  border-bottom: none;
}

.cart-item:hover {
  background: rgba(99, 102, 241, 0.02);
  margin: 0 -16px;
  padding-left: 16px !important;
  padding-right: 16px !important;
  border-radius: 12px;
}

.cart-item-image-wrapper {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-right: 20px;
}

.cart-item-image {
  border-radius: 12px;
}

.cart-item-title {
  font-size: 1.125rem !important;
  font-weight: 600 !important;
  color: #1e293b !important;
  margin-bottom: 8px !important;
}

.cart-item-subtitle {
  color: #64748b !important;
}

.brand-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #475569;
}

.selected-options {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.option-chip {
  font-weight: 500;
}

.cart-item-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  padding: 4px;
  border-radius: 10px;
}

.quantity-btn {
  min-width: 36px !important;
  height: 36px !important;
}

.quantity-input {
  width: 70px;
}

.quantity-input :deep(.v-field__input) {
  text-align: center;
  font-weight: 600;
}

.item-price {
  font-size: 1.375rem;
  font-weight: 700;
  min-width: 120px;
  text-align: right;
  color: #1e293b;
}

.delete-btn {
  transition: all 0.3s;
}

.delete-btn:hover {
  transform: scale(1.1);
}

.cart-summary {
  background: #f8fafc;
  padding: 32px;
  border-radius: 0;
  margin-top: 32px;
  border: 1px solid #e2e8f0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  font-size: 1rem;
  color: #64748b;
  font-weight: 500;
}

.summary-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.total-row {
  margin-top: 8px;
}

.summary-total-label {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.summary-total-price {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -1px;
}

.checkout-btn {
  border-radius: 0 !important;
  font-weight: 600 !important;
  text-transform: none !important;
  font-size: 1rem !important;
  letter-spacing: 0.3px;
  box-shadow: none !important;
  transition: all 0.2s ease !important;
}

.checkout-btn:hover {
  opacity: 0.9;
}

@media (max-width: 768px) {
  .cart-container {
    padding: 16px;
  }

  .cart-title {
    padding: 20px 24px !important;
    font-size: 1.5rem !important;
  }

  .cart-item {
    padding: 20px 0 !important;
  }

  .cart-item-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    width: 100%;
  }

  .item-price {
    text-align: left;
    width: 100%;
  }

  .cart-summary {
    padding: 24px;
  }

  .summary-total-price {
    font-size: 1.75rem;
  }
}
</style>

