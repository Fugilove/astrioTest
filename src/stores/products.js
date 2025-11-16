import { defineStore } from 'pinia'
import productsData from '../assets/data/products.json'
import brandsData from '../assets/data/brands.json'

export const useProductsStore = defineStore('products', {
  state: () => ({
    products: [],
    brands: brandsData,
    selectedBrand: null,
    loading: false,
    level3Loaded: false
  }),

  getters: {
    filteredProducts: (state) => {
      if (!state.selectedBrand) {
        return state.products
      }
      return state.products.filter(product => product.brand === state.selectedBrand)
    },

    getBrandById: (state) => (id) => {
      return state.brands.find(brand => brand.id === id)
    }
  },

  actions: {
    setSelectedBrand(brandId) {
      this.selectedBrand = brandId === this.selectedBrand ? null : brandId
    },

    async loadLevel3Products() {
      // Если Level 3 продукты уже загружены, не загружаем повторно
      if (this.level3Loaded) {
        return
      }
      
      try {
        const level3Products = await import('../assets/data/products-level3.json')
        if (level3Products.default && level3Products.default.length > 0) {
          // Заменяем продукты на Level 3, так как они содержат полный набор
          // включая настраиваемые товары
          // Убираем дубликаты по ID, оставляя только первый найденный
          const uniqueProducts = []
          const seenIds = new Map()
          
          // Добавляем Level 3 продукты, сохраняя порядок
          level3Products.default.forEach(product => {
            const productId = Number(product.id)
            if (!seenIds.has(productId)) {
              seenIds.set(productId, true)
              uniqueProducts.push(product)
            }
          })
          
          this.products = uniqueProducts
          this.level3Loaded = true
        } else {
          // Если Level 3 не загрузился, используем базовые продукты
          if (this.products.length === 0) {
            this.products = productsData
          }
        }
      } catch (error) {
        console.warn('Level 3 products not found, using default products', error)
        // Если Level 3 не загрузился, используем базовые продукты
        if (this.products.length === 0) {
          this.products = productsData
        }
      }
    }
  }
})

