<template>
  <div class="card h-100" @click="$emit('click')">
    <div class="image-container">
      <div v-show="loading" class="loading-overlay">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <img 
        :src="imageUrl" 
        class="card-img-top" 
        :alt="title"
        @load="loading = false"
        @error="handleImageError"
      >
    </div>
    <div class="card-body">
      <h5 class="card-title text-truncate" :title="title">{{ title }}</h5>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'ImageCard',
  props: {
    imageUrl: {
      type: String,
      default: 'https://via.placeholder.com/300x200'
    },
    title: {
      type: String,
      required: true
    }
  },
  setup() {
    const loading = ref(true)
    const hasError = ref(false)

    const handleImageError = () => {
      loading.value = false
      hasError.value = true
    }

    return {
      loading,
      hasError,
      handleImageError
    }
  },
  emits: ['click']
}
</script>

<style scoped>
.card {
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.image-container {
  position: relative;
  padding-top: 75%; /* 4:3 Aspect Ratio */
  overflow: hidden;
  background-color: #f8f9fa;
}

.card-img-top {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 1;
}

.card-title {
  font-size: 1rem;
  margin-bottom: 0;
}
</style>