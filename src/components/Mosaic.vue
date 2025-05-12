<template>
  <div class="container-fluid mosaic-container">
    <!-- Skeleton while loading -->
    <div v-if="isLoading" class="row">
      <div v-for="i in 12" :key="`skel-${i}`" class="col-sm-6 col-lg-4 mb-4">
        <div class="skeleton-box" :style="{ height: randomHeight() + 'px' }"></div>
      </div>
    </div>

    <!-- Masonry layout using Bootstrap 5 data-masonry -->
    <div v-else class="row" data-masonry='{"percentPosition": true }'>
      <div
        v-for="(item, index) in items"
        :key="index"
        class="col-sm-6 col-lg-3 mb-4"
      >
        <div class="card">
          <img
            :src="item.src"
            :alt="`Image ${index}`"
            class="card-img-top"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import imagesLoaded from 'imagesloaded';

export default {
  name: 'Mosaic',
  data() {
    return {
      isLoading: true,
      items: [],
    };
  },
  methods: {
    generateFakeItems(count = 30) {
      const items = [];
      for (let i = 0; i < count; i++) {
        const width = Math.floor(Math.random() * 200 + 150);
        const height = Math.floor(Math.random() * 200 + 100);
        items.push({
          src: `https://placehold.co/${width}x${height}/eee/777?text=${width}x${height}`
        });
      }
      return items;
    },
    randomHeight() {
      return Math.floor(Math.random() * 200 + 100);
    },
    waitForImagesThenLayout() {
      const container = this.$el.querySelector('[data-masonry]');
      if (container) {
        imagesLoaded(container, () => {
          // Manually trigger Masonry layout after images are loaded
          const Masonry = window.Masonry || require('masonry-layout');
          new Masonry(container, { percentPosition: true });
        });
      }
    }
  },
  mounted() {
    setTimeout(() => {
      this.items = this.generateFakeItems();
      this.isLoading = false;
      this.$nextTick(() => {
        this.waitForImagesThenLayout();
      });
    }, 1000);
  },
};
</script>

<style scoped lang="scss">
.mosaic-container {
  /* Optional additional styling */
}

.skeleton-box {
  background-color: #e9ecef;
  border-radius: 0.375rem;
  width: 100%;
  display: block;
}

.card {
  border: none;
}

.card-img-top {
  width: 100%;
  height: auto;
  display: block;
}
</style>
