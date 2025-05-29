<template>
  <div class="container py-4">
    <div class="row g-4">
      <div v-for="item in items" :key="item.id" class="col-12 col-sm-6 col-md-4 col-lg-3">
        <image-card
          :title="item.title"
          :image-url="item.imageUrl"
        />
      </div>
    </div>
    <!-- Loading indicator -->
    <div v-if="loading" class="text-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <!-- No more items indicator -->
    <div v-if="!hasMore && items.length > 0" class="text-center text-muted my-4">
      No more images to load
    </div>
    <page-toolbar
      @view-change="handleViewChange"
      @toggle-date-picker="handleDatePicker"
      @toggle-color-picker="handleColorPicker"
    />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import ImageCard from '@/components/ImageCard.vue';
import PageToolbar from '@/components/Toolbar.vue';
import { api } from '@/services/api';

export default {
  name: 'HomePage',
  components: {
    ImageCard,
    PageToolbar
  },
  setup() {
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
        currentPage.value++;
      } catch (error) {
        console.error('Error loading images:', error);
      } finally {
        loading.value = false;
      }
    };

    const handleScroll = () => {
      const scrollPosition = window.innerHeight + window.scrollY;
      const pageBottom = document.documentElement.offsetHeight - 1000; // Load more 1000px before bottom
      
      if (scrollPosition >= pageBottom) {
        loadMoreItems();
      }
    };

    // Initial load and scroll handling
    onMounted(() => {
      loadMoreItems();
      window.addEventListener('scroll', handleScroll);
    });

    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll);
    });

    const handleViewChange = (mode) => {
      console.log('View mode changed to:', mode);
    };

    const handleDatePicker = () => {
      console.log('Toggle date picker');
    };

    const handleColorPicker = () => {
      console.log('Toggle color picker');
    };

    return {
      items,
      loading,
      hasMore,
      handleViewChange,
      handleDatePicker,
      handleColorPicker,
    };
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh; /* Ensure full page height */
}
</style>
