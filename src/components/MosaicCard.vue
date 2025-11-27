<template>
  <router-link :to="`/explore/dados/image/${id}`" class="mosaic-card">
    <div class="image-container" :style="containerStyle">
      <img :src="imageUrl" :alt="title" class="card-img" />
    </div>
  </router-link>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
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
  aspectRatio: {
    type: Number,
    default: 1,
  },
});

const isValidAspectRatio = computed(() => {
  return Number.isFinite(props.aspectRatio) && props.aspectRatio > 0;
});

const containerStyle = computed(() => {
  if (!isValidAspectRatio.value) {
    return {};
  }

  return {
    "--aspect-ratio": props.aspectRatio,
  };
});
</script>

<style scoped>
.mosaic-card {
  display: block;
  text-decoration: none;
  break-inside: avoid;
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
  border-radius: 0px;
  aspect-ratio: var(--aspect-ratio, 1);
  display: flex;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.mosaic-card:hover .card-img {
  transform: scale(1.05);
}
</style>
