<template>
  <div>
    <div class="row g-4">
      <div v-for="item in items" :key="item.id" class="col-6 col-md-4 col-lg-3">
        <image-card
          :id="item.id"
          :title="item.title"
          :image-url="item.imageUrl"
        />
      </div>
    </div>

    <div v-if="loading" class="text-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import ImageCard from "@/components/ImageCard.vue";
import { api } from "@/services/api";

const items = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const hasMore = ref(true);

const loadMoreItems = async () => {
  if (loading.value || !hasMore.value) return;

  loading.value = true;
  try {
    const response = await api.getImages(currentPage.value);
    items.value.push(...response.items);
    hasMore.value = response.hasMore;
    currentPage.value += 1;
  } catch (error) {
    console.error("Error loading images:", error);
  } finally {
    loading.value = false;
  }
};

const handleScroll = () => {
  const scrollPosition = window.innerHeight + window.scrollY;
  const pageBottom = document.documentElement.offsetHeight - 1000;

  if (scrollPosition >= pageBottom) {
    loadMoreItems();
  }
};

onMounted(() => {
  loadMoreItems();
  window.addEventListener("scroll", handleScroll);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>
