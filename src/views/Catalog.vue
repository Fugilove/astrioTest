<template>
  <div class="catalog-container">
    <v-row>
      <!-- Фильтр брендов -->
      <v-col cols="12" md="3" lg="2">
        <v-card class="brand-filter">
          <v-card-title>Бренды</v-card-title>
          <v-card-text>
            <div 
              v-for="brand in productsStore.brands" 
              :key="brand.id"
              class="brand-item"
              :class="{ active: productsStore.selectedBrand === brand.id }"
              @click="productsStore.setSelectedBrand(brand.id)"
            >
              {{ brand.title }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Список товаров -->
      <v-col cols="12" md="9" lg="10">
        <v-row class="products-grid">
          <v-col 
            v-for="(product, index) in productsStore.filteredProducts" 
            :key="`product-${product.id}-${product.sku}-${index}`"
            cols="12" 
            sm="6" 
            md="6"
            lg="4"
            xl="3"
          >
            <ProductCard :product="product" />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useProductsStore } from '../stores/products'
import ProductCard from '../components/ProductCard.vue'

const productsStore = useProductsStore()

onMounted(async () => {
  // Загружаем Level 3 продукты при монтировании каталога
  if (productsStore.products.length <= 9) {
    await productsStore.loadLevel3Products()
  }
})
</script>

<style scoped>
.catalog-container {
  padding: 32px 24px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 80px);
}

.brand-filter {
  position: sticky;
  top: 100px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  border-radius: 0 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid #e2e8f0 !important;
  background: white !important;
  overflow-x: hidden;
}

.brand-filter :deep(.v-card-title) {
  font-size: 1rem !important;
  font-weight: 600 !important;
  color: #1e293b !important;
  padding: 20px 20px 12px 20px !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.brand-filter :deep(.v-card-text) {
  padding: 8px 12px 20px 12px !important;
}

.brand-item {
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 10px;
  margin-bottom: 6px;
  font-weight: 500;
  color: #64748b;
  position: relative;
  overflow: hidden;
}

.brand-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transform: scaleY(0);
  transition: transform 0.3s;
}

.brand-item:hover {
  background: #f8fafc;
  color: #1e293b;
  transform: translateX(4px);
  padding-left: 20px;
}

.brand-item:hover::before {
  transform: scaleY(1);
}

.brand-item.active {
  background: #f1f5f9;
  color: #1e293b;
  font-weight: 600;
  padding-left: 20px;
}

.brand-item.active::before {
  background: #1e293b;
  transform: scaleY(1);
}

.products-grid {
  margin: 0;
  gap: 24px;
}

.products-grid :deep(.v-col) {
  padding: 0;
  margin-bottom: 24px;
}

/* Кастомный скроллбар для фильтра */
.brand-filter::-webkit-scrollbar {
  width: 6px;
}

.brand-filter::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 10px;
}

.brand-filter::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.brand-filter::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>

