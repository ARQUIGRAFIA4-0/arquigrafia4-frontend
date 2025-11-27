<template>
  <div class="mosaic-card" @click="handleClick">
    <div class="image-container" :style="containerStyle">
      <img :src="imageUrl" :alt="title" class="card-img" />
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
</style>
