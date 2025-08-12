<template>
  <div class="container-fluid mosaic-container">
    <div class="masonry-grid">
      <mosaic-card
        v-for="(item, index) in items"
        :key="index"
        :id="item.id"
        :title="item.title"
        :image-url="item.src"
        @load="onImageLoad"
      />
    </div>

    <!-- Loading indicator -->
    <div v-if="isLoading" class="text-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  </div>
</template>

<script>
import imagesLoaded from "imagesloaded";
import { api } from "@/services/api";
import MosaicCard from "./MosaicCard.vue";

export default {
  components: {
    MosaicCard,
  },
  name: "ImageMosaic",
  data() {
    return {
      isLoading: false,
      items: [],
      currentPage: 1,
      hasMore: true,
      loadedImages: 0,
    };
  },
  methods: {
    async loadImages() {
      if (this.isLoading || !this.hasMore) return;

      this.isLoading = true;
      try {
        const response = await api.getImages(this.currentPage);
        const newItems = response.items.map((item) => ({
          id: item.id,
          src: item.imageUrl,
          title: item.title,
          spanTwoColumns: Math.random() < 0.3, // 30% chance to span two columns
        }));
        this.items.push(...newItems);
        this.hasMore = response.hasMore;
        this.currentPage++;
      } catch (error) {
        console.error("Error loading images:", error);
      } finally {
        this.isLoading = false;
      }
    },
    handleScroll() {
      const scrollPosition = window.innerHeight + window.scrollY;
      const pageBottom = document.documentElement.offsetHeight - 1000;

      if (scrollPosition >= pageBottom) {
        this.loadImages();
      }
    },
    onImageLoad() {
      this.loadedImages++;
      if (this.loadedImages % 4 === 0) {
        // Refresh layout every 4 images
        this.refreshMasonryLayout();
      }
    },
    refreshMasonryLayout() {
      const container = this.$el.querySelector("[data-masonry]");
      if (container && window.Masonry) {
        imagesLoaded(container, () => {
          new window.Masonry(container, { percentPosition: true });
        });
      }
    },
  },
  mounted() {
    // Load initial images
    this.loadImages();

    // Add scroll listener for infinite loading
    window.addEventListener("scroll", this.handleScroll);

    // Add Masonry script if not already loaded
    if (!window.Masonry) {
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/masonry-layout@4.2.2/dist/masonry.pkgd.min.js";
      script.async = true;
      document.head.appendChild(script);
    }
  },
  beforeUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
  },
};
</script>

<style scoped>
.mosaic-container {
  min-height: 100vh;
  /* padding: 1rem; */
}

.masonry-grid {
  columns: 1;
  column-gap: 1rem;
}

@media (min-width: 576px) {
  .masonry-grid {
    columns: 2;
  }
}

@media (min-width: 768px) {
  .masonry-grid {
    columns: 3;
  }
}

@media (min-width: 992px) {
  .masonry-grid {
    columns: 4;
  }
}
</style>
