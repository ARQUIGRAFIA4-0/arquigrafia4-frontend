<template>
  <div class="mosaic-card" @click="handleClick">
    <div class="image-container">
      <div v-show="loading" class="loading-overlay">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <img
        :src="imageUrl"
        :alt="title"
        class="card-img"
        @load="onLoad"
        @error="handleImageError"
      />
      <div class="hover-overlay">
        <p class="image-title">{{ title }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import { useRouter } from "vue-router";

export default {
  name: "MosaicCard",
  props: {
    id: {
      type: [String, Number],
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
  },
  emits: ["load"],
  setup(props, { emit }) {
    const router = useRouter();
    const loading = ref(true);

    const handleImageError = () => {
      loading.value = false;
    };

    const handleClick = () => {
      router.push(`/image/${props.id}`);
    };

    const onLoad = (event) => {
      loading.value = false;
      emit("load", event);
    };

    return {
      loading,
      handleImageError,
      handleClick,
      onLoad,
    };
  },
};
</script>

<style scoped>
.mosaic-card {
  break-inside: avoid;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.mosaic-card:hover {
  transform: translateY(-5px);
}

.image-container {
  position: relative;
  width: 100%;
  background-color: #f8f9fa;
  overflow: hidden;
  border-radius: 8px;
}

.card-img {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.3s ease;
}

.mosaic-card:hover .card-img {
  transform: scale(1.05);
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

.hover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.8),
    rgba(0, 0, 0, 0.2),
    transparent
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: flex-end;
  padding: 1.5rem;
}

.mosaic-card:hover .hover-overlay {
  opacity: 1;
}

.image-title {
  color: white;
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}
</style>
