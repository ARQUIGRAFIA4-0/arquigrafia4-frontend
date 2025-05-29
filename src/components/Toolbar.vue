<template>
  <div class="toolbar">
    <div class="toolbar-content">
      <!-- View Toggle -->
      <button class="btn btn-light" @click="toggleView">
        <i class="bi" :class="viewMode === 'grid' ? 'bi-grid-3x3' : 'bi-map'"></i>
      </button>

      <!-- Search -->
      <div class="search-container">
        <button class="btn btn-light" @click="toggleSearch">
          <i class="bi bi-search"></i>
        </button>
        <transition name="slide">
          <input
            v-show="isSearchVisible"
            type="text"
            class="form-control search-input"
            placeholder="Buscar..."
            v-model="searchQuery"
            @input="handleSearch"
          >
        </transition>
      </div>

      <!-- Date Range -->
      <button class="btn btn-light" @click="toggleDatePicker">
        <i class="bi bi-calendar-range"></i>
      </button>

      <!-- Color Picker -->
      <button class="btn btn-light" @click="toggleColorPicker">
        <i class="bi bi-palette"></i>
      </button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'PageToolbar',
  setup(props, { emit }) {
    const viewMode = ref('grid')
    const isSearchVisible = ref(false)
    const searchQuery = ref('')

    const toggleView = () => {
      viewMode.value = viewMode.value === 'grid' ? 'map' : 'grid'
      emit('view-change', viewMode.value)
    }

    const toggleSearch = () => {
      isSearchVisible.value = !isSearchVisible.value
    }

    const toggleDatePicker = () => {
      emit('toggle-date-picker')
    }

    const toggleColorPicker = () => {
      emit('toggle-color-picker')
    }

    return {
      viewMode,
      isSearchVisible,
      searchQuery,
      toggleView,
      toggleSearch,
      toggleDatePicker,
      toggleColorPicker
    }
  },
  emits: ['view-change', 'toggle-date-picker', 'toggle-color-picker']
}
</script>

<style scoped>
.toolbar {
  position: fixed;
  top: 80vh;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transition: transform 0.3s ease;
}

.toolbar:hover {
  transform: translate(-50%, -2px);
}

.toolbar-content {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  justify-content: center;
  min-width: 280px;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  position: absolute;
  right: 100%;
  width: 200px;
  margin-right: 10px;
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

@media (max-width: 768px) {
  .toolbar-content {
    justify-content: space-around;
  }
  
  .search-input {
    width: 150px;
  }
}
</style>