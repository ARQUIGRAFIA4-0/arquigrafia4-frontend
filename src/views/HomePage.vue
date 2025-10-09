<template>
  <div class="container-fluid p-4">
    <template v-if="viewMode === 'grid'">
      <view-grid />
    </template>

    <template v-else-if="viewMode === 'mosaic'">
      <view-mosaic />
    </template>

    <template v-else>
      <view-map />
    </template>
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
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { uiStore } from "@/store/ui";
import PageToolbar from "@/components/Toolbar.vue";
import PageToolbarMobile from "@/components/ToolbarMobile.vue";
import MobileDrawerSearchDate from "@/components/homepage/MobileDrawerSearchDate.vue";
import MobileDrawerSearchColor from "@/components/homepage/MobileDrawerSearchColor.vue";
import MobileDrawerViewMenu from "@/components/homepage/MobileDrawerViewMenu.vue";
import MobileDrawerSearchText from "@/components/homepage/MobileDrawerSearchText.vue";
import AdvancedSearchModal from "@/components/homepage/AdvancedSearchModal.vue";
import ViewGrid from "@/components/homepage/ViewGrid.vue";
import ViewMap from "@/components/homepage/ViewMap.vue";
import ViewMosaic from "@/components/homepage/ViewMosaic.vue";
import { useBreakpoints } from "@vueuse/core";

export default {
  name: "HomePage",
  components: {
    PageToolbar,
    PageToolbarMobile,
    MobileDrawerSearchDate,
    MobileDrawerSearchColor,
    MobileDrawerViewMenu,
    MobileDrawerSearchText,
    AdvancedSearchModal,
    ViewGrid,
    ViewMap,
    ViewMosaic,
  },
  setup() {
    const store = uiStore();
    const { viewMode } = storeToRefs(store);
    const breakpoints = useBreakpoints({ md: 768 });
    const isMobile = breakpoints.smaller("md");

    const handleViewChange = (mode) => {
      store.setViewMode(mode);
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
