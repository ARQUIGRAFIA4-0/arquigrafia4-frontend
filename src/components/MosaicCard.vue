<template>
  <div class="mosaic-card" @click="handleClick">
    <div class="image-container" :style="containerStyle">
      <img :src="imageUrl" :alt="title" class="card-img" />
      <div class="hover-overlay">
        <p class="image-title">{{ title }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";

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

const router = useRouter();

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

const handleClick = () => {
  router.push(`/explore/dados/image/${props.id}`);
};
</script>

<style scoped>
.mosaic-card {
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
