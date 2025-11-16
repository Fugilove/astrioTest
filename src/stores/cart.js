import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: []
  }),

  getters: {
    totalItems: (state) => {
      return state.items.reduce((total, item) => total + item.quantity, 0)
    },
    totalPrice: (state) => {
      return state.items.reduce((total, item) => {
        return total + (item.product.regular_price.value * item.quantity)
      }, 0)
    }
  },

  actions: {
    addItem(product, selectedOptions = null) {
      const existingItemIndex = this.items.findIndex(item => {
        if (item.product.id !== product.id) return false
        if (!selectedOptions && !item.selectedOptions) return true
        if (!selectedOptions || !item.selectedOptions) return false
        
        return JSON.stringify(item.selectedOptions) === JSON.stringify(selectedOptions)
      })

      if (existingItemIndex !== -1) {
        this.items[existingItemIndex].quantity++
      } else {
        this.items.push({
          product,
          quantity: 1,
          selectedOptions
        })
      }
    },

    removeItem(index) {
      this.items.splice(index, 1)
    },

    updateQuantity(index, quantity) {
      if (quantity <= 0) {
        this.removeItem(index)
      } else {
        this.items[index].quantity = quantity
      }
    },

    clearCart() {
      this.items = []
    }
  }
})

