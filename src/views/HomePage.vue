<template>
  <div class="container-fluid p-4">
    <template v-if="viewMode === 'grid'">
      <div class="row g-4">
        <div
          v-for="item in items"
          :key="item.id"
          class="col-6 col-md-4 col-lg-3"
        >
          <image-card
            :id="item.id"
            :title="item.title"
            :image-url="item.imageUrl"
          />
        </div>
      </div>
    </template>

    <template v-else-if="viewMode === 'mosaic'">
      <image-mosaic />
    </template>

    <template v-else>
      <div class="text-center py-5">
        <h3>Map View</h3>
        <p class="text-muted">Map view coming soon...</p>
      </div>
    </template>
    <!-- Loading indicator -->
    <div v-if="loading" class="text-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <!-- No more items indicator -->
    <div
      v-if="!hasMore && items.length > 0"
      class="text-center text-muted my-4"
    >
      No more images to load
    </div>
    <div class="toolbar">
      <template v-if="isMobile">
        <page-toolbar-mobile
          :current-view="viewMode"
          @open-view-menu="() => (drawerViewMenu = true)"
          @open-search-text="() => (drawerSearchText = true)"
          @open-search-color="() => (drawerSearchColor = true)"
          @open-search-date="() => (drawerSearchDate = true)"
        />
      </template>
      <template v-else>
        <page-toolbar
          :advanced-filters="advancedFilters"
          @view-change="handleViewChange"
          @toggle-date-picker="handleDatePicker"
          @toggle-color-picker="handleColorPicker"
          @open-advanced-search="openAdvancedSearch"
          @remove-advanced-chip="removeAdvancedChip"
          @confirm="onConfirmSearch"
        />
      </template>
    </div>

    <!-- Mobile Drawers -->
    <mobile-drawer-view-menu
      v-model="drawerViewMenu"
      @select="selectViewMode"
    />

    <mobile-drawer-search-text
      v-model="drawerSearchText"
      @confirm="onConfirmSearch"
    />

    <mobile-drawer-search-color
      v-model="drawerSearchColor"
      :available-colors="availableColors"
      :value="selectedColor"
      @update:value="(v) => (selectedColor = v)"
      @confirm="onConfirmColor"
    />

    <mobile-drawer-search-date
      v-model="drawerSearchDate"
      @confirm="onConfirmDate"
    />

    <advanced-search-modal
      v-model="modalAdvancedSearch"
      :filters="advancedFilters"
      @confirm="onConfirmAdvanced"
    />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { uiStore } from "@/store/ui";
import ImageCard from "@/components/ImageCard.vue";
import ImageMosaic from "@/components/Mosaic.vue";
import PageToolbar from "@/components/Toolbar.vue";
import PageToolbarMobile from "@/components/ToolbarMobile.vue";
import MobileDrawerSearchDate from "@/components/homepage/MobileDrawerSearchDate.vue";
import MobileDrawerSearchColor from "@/components/homepage/MobileDrawerSearchColor.vue";
import MobileDrawerViewMenu from "@/components/homepage/MobileDrawerViewMenu.vue";
import MobileDrawerSearchText from "@/components/homepage/MobileDrawerSearchText.vue";
import AdvancedSearchModal from "@/components/homepage/AdvancedSearchModal.vue";
import { api } from "@/services/api";
import { useBreakpoints } from "@vueuse/core";

export default {
  name: "HomePage",
  components: {
    ImageCard,
    ImageMosaic,
    PageToolbar,
    PageToolbarMobile,
    MobileDrawerSearchDate,
    MobileDrawerSearchColor,
    MobileDrawerViewMenu,
    MobileDrawerSearchText,
    AdvancedSearchModal,
  },
  setup() {
    const store = uiStore();
    const { viewMode } = storeToRefs(store);
    const items = ref([]);
    const loading = ref(false);
    const currentPage = ref(1);
    const hasMore = ref(true);
    const breakpoints = useBreakpoints({ md: 768 });
    const isMobile = breakpoints.smaller("md");

    const loadMoreItems = async () => {
      if (loading.value || !hasMore.value) return;

      loading.value = true;
      try {
        const response = await api.getImages(currentPage.value);
        items.value.push(...response.items);
        hasMore.value = response.hasMore;
        currentPage.value++;
      } catch (error) {
        console.error("Error loading images:", error);
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
      window.addEventListener("scroll", handleScroll);
    });

    onUnmounted(() => {
      window.removeEventListener("scroll", handleScroll);
    });

    const handleViewChange = (mode) => {
      store.setViewMode(mode);
      if (mode === "grid") {
        // Reset grid view if needed
        if (items.value.length === 0) {
          loadMoreItems();
        }
      }
    };

    const handleDatePicker = () => {
      console.log("Toggle date picker");
    };

    const handleColorPicker = () => {
      console.log("Toggle color picker");
    };

    // Drawer state (mobile)
    const drawerViewMenu = ref(false);
    const drawerSearchText = ref(false);
    const drawerSearchColor = ref(false);
    const drawerSearchDate = ref(false);
    const modalAdvancedSearch = ref(false);
    const advancedFilters = ref({
      terms: [],
      locations: [],
      tags: [],
      use: null,
    });

    // Simple demo data/state for search drawers
    const availableColors = ref([
      "#000000",
      "#EF4444",
      "#F59E0B",
      "#10B981",
      "#3B82F6",
      "#8B5CF6",
    ]);
    const selectedColor = ref(null);

    const selectViewMode = (mode) => {
      store.setViewMode(mode);
      drawerViewMenu.value = false;
      if (mode === "grid" && items.value.length === 0) {
        loadMoreItems();
      }
    };

    const onConfirmColor = (color) => {
      console.log("Search color:", color);
      drawerSearchColor.value = false;
    };
    const onConfirmDate = (payload) => {
      console.log("Search date:", payload);
    };
    const openAdvancedSearch = () => {
      modalAdvancedSearch.value = true;
    };

    const applyAdvancedFilters = (payload) => {
      advancedFilters.value = {
        terms: payload.terms || [],
        locations: payload.locations || [],
        tags: payload.tags || [],
        use: payload.use || null,
      };
    };

    const onConfirmAdvanced = (payload) => {
      applyAdvancedFilters(payload);
      console.log("Advanced search confirm:", payload);
      modalAdvancedSearch.value = false;
    };

    const removeAdvancedChip = (chip) => {
      const updated = { ...advancedFilters.value };
      switch (chip.type) {
        case "term":
          updated.terms = [...(updated.terms || [])];
          updated.terms.splice(chip.index, 1);
          break;
        case "location":
          updated.locations = [...(updated.locations || [])];
          updated.locations.splice(chip.index, 1);
          break;
        case "tag":
          updated.tags = [...(updated.tags || [])];
          updated.tags.splice(chip.index, 1);
          break;
        case "use":
          updated.use = null;
          break;
        default:
          break;
      }
      applyAdvancedFilters(updated);
    };

    const onConfirmSearch = (payload) => {
      // TODO: conectar com API/estado quando a busca estiver implementada
      console.log("Search confirm:", payload);
    };

    return {
      items,
      loading,
      hasMore,
      viewMode,
      isMobile,
      handleViewChange,
      handleDatePicker,
      handleColorPicker,
      onConfirmSearch,
      drawerViewMenu,
      drawerSearchText,
      drawerSearchColor,
      drawerSearchDate,
      modalAdvancedSearch,
      advancedFilters,
      availableColors,
      selectedColor,
      onConfirmColor,
      onConfirmDate,
      onConfirmAdvanced,
      openAdvancedSearch,
      removeAdvancedChip,
      selectViewMode,
    };
  },
};
</script>

<style scoped>
.container {
  min-height: 100vh; /* Ensure full page height */
}

.toolbar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  max-width: fit-content;
  padding-bottom: 32px;
  z-index: 1000;
}
</style>
