<template>
  <v-app>
    <v-app-bar 
      :class="['modern-header', { 'scrolled': isScrolled }]"
      elevation="0"
      :height="80"
    >
      <v-app-bar-nav-icon 
        @click="drawer = !drawer"
        class="menu-icon"
      ></v-app-bar-nav-icon>
      <v-toolbar-title class="logo-container">
        <router-link to="/" class="logo-link">
          <img 
            src="/images/logo.png" 
            alt="Logo" 
            class="logo" 
            @error="logoExists = false" 
            @load="logoExists = true" 
            v-show="logoExists" 
          />
          <span v-show="!logoExists" class="logo-text">SHOP</span>
        </router-link>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <div class="cart-wrapper">
      <v-badge 
        :content="cartItemsCount" 
        :value="cartItemsCount" 
        color="primary" 
        overlap
        class="cart-badge"
      >
          <v-btn 
            icon 
            @click="$router.push('/cart')"
            :class="['cart-btn', { 'cart-btn-animate': cartAnimation }]"
            size="large"
          >
            <v-icon size="28">mdi-cart-outline</v-icon>
          </v-btn>
        </v-badge>
      </div>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" temporary>
      <v-list>
        <v-list-item>
          <router-link to="/" class="nav-link">Каталог</router-link>
        </v-list-item>
        <v-list-item>
          <router-link to="/cart" class="nav-link">Корзина</router-link>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view />
    </v-main>

    <!-- Toast уведомления -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top right"
      class="toast-notification"
    >
      <div class="toast-content">
        <v-icon class="toast-icon">{{ snackbar.icon }}</v-icon>
        <span>{{ snackbar.message }}</span>
      </div>
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Анимация падения товара -->
    <div
      v-if="flyingItem.show"
      class="flying-item"
      :style="flyingItem.style"
    >
      <img :src="flyingItem.image" :alt="flyingItem.title" />
    </div>
  </v-app>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useCartStore } from './stores/cart'

const drawer = ref(false)
const cartStore = useCartStore()
const logoExists = ref(true)
const cartAnimation = ref(false)
const isScrolled = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll() // Проверяем начальное состояние
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const snackbar = ref({
  show: false,
  message: '',
  color: 'primary',
  icon: 'mdi-check-circle'
})

const flyingItem = ref({
  show: false,
  image: '',
  title: '',
  style: {}
})

const cartItemsCount = computed(() => {
  return cartStore.totalItems
})

// Слушаем события добавления товара
const handleAddToCart = (event) => {
  const { product, image, startRect } = event.detail
  
  // Показываем toast
  snackbar.value = {
    show: true,
    message: `${product.title} добавлен в корзину!`,
    color: 'primary',
    icon: 'mdi-check-circle'
  }

  // Анимация кнопки корзины
  cartAnimation.value = true
  setTimeout(() => {
    cartAnimation.value = false
  }, 500)

  // Запускаем анимацию падения
  if (startRect) {
    const cartButton = document.querySelector('.cart-btn')
    if (cartButton) {
      const cartRect = cartButton.getBoundingClientRect()
      
      flyingItem.value = {
        show: true,
        image: image,
        title: product.title,
        style: {
          left: `${startRect.left}px`,
          top: `${startRect.top}px`,
          width: `${startRect.width}px`,
          height: `${startRect.height}px`
        }
      }

      // Запускаем анимацию с небольшой задержкой для плавности
      requestAnimationFrame(() => {
        setTimeout(() => {
          flyingItem.value.style = {
            left: `${cartRect.left + cartRect.width / 2 - 20}px`,
            top: `${cartRect.top + cartRect.height / 2 - 20}px`,
            width: '40px',
            height: '40px',
            opacity: '0',
            transform: 'scale(0.2) rotate(360deg)'
          }
        }, 50)
      })

      // Убираем элемент после анимации
      setTimeout(() => {
        flyingItem.value.show = false
        flyingItem.value.style = {}
      }, 900)
    }
  }
}

// Подписываемся на события
if (typeof window !== 'undefined') {
  window.addEventListener('add-to-cart', handleAddToCart)
}
</script>

<style scoped>
.modern-header {
  background: #ffffff !important;
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
  border-bottom: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.modern-header.scrolled {
  background: #000000 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
  border-bottom: 1px solid #1a1a1a;
}

.logo-container {
  margin-left: 16px;
}

.logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #1e293b;
  font-weight: 700;
  font-size: 1.5rem;
  letter-spacing: -0.5px;
}

.logo {
  height: 45px;
  width: auto;
  max-width: 200px;
  object-fit: contain;
}

.logo-text {
  color: #1e293b;
  font-weight: 800;
  letter-spacing: 2px;
}

.menu-icon {
  color: #1e293b !important;
  transition: color 0.3s ease !important;
}

.modern-header.scrolled .menu-icon {
  color: #ffffff !important;
}

.cart-btn {
  color: #1e293b !important;
  transition: all 0.3s ease;
}

.modern-header.scrolled .cart-btn {
  color: #ffffff !important;
}

.cart-btn:hover {
  transform: scale(1.05);
  background: #f1f5f9 !important;
}

.modern-header.scrolled .cart-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

.cart-wrapper {
  margin-right: 16px;
}

.cart-badge :deep(.v-badge__badge) {
  font-weight: 700;
  font-size: 0.75rem;
  padding: 4px 6px;
  min-width: 22px;
  height: 22px;
}

.nav-link {
  text-decoration: none;
  color: inherit;
  width: 100%;
  display: block;
  padding: 12px 16px;
  border-radius: 8px;
  transition: all 0.2s;
}

.nav-link:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

/* Toast уведомления */
.toast-notification :deep(.v-snackbar__wrapper) {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.toast-notification :deep(.v-snackbar__content) {
  padding: 16px 20px;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  font-size: 0.9375rem;
}

.toast-icon {
  font-size: 28px;
  animation: toastIconBounce 0.5s ease;
}

@keyframes toastIconBounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2) rotate(10deg);
  }
}

/* Анимация падения товара */
.flying-item {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  transition: all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  border: 2px solid white;
  opacity: 1;
}

.flying-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
  display: block;
}
</style>

