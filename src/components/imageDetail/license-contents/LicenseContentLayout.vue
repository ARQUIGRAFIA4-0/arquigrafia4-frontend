<template>
  <div class="metadata-license-content">
    <div v-if="showImage && imageUrl" class="metadata-license-image">
      <img
        :src="imageUrl"
        :alt="`Licença Creative Commons ${licenseInfo.label}`"
        class="license-img"
      />
    </div>

    <div class="metadata-license-text">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { getLicenseImageUrl } from "./licenseImageUrl";

defineOptions({ name: "LicenseContentLayout" });

const props = defineProps({
  licenseInfo: {
    type: Object,
    required: true,
  },
  /** Exibe o logo CC ao lado do texto (desligue em licenças específicas, ex. BY-NC-ND). */
  showImage: {
    type: Boolean,
    default: true,
  },
});

const imageUrl = computed(() => getLicenseImageUrl(props.licenseInfo));
</script>

<style lang="scss" scoped>
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.metadata-license-content {
  display: flex;
  flex-direction: row;
  gap: 48px;
}

.metadata-license-image {
  display: flex;
  align-items: flex-start;

  @include md {
    margin-bottom: 0;
  }
}

.license-img {
  max-height: 120px;
  width: auto;
  display: block;
}

.metadata-license-text {
  flex: 1 1 220px;
  min-width: 220px;
}

:deep(.metadata-text) {
  color: var(--Preto, #1F1F1F);
  font-family: "DM Sans";
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 125%;
}

:deep(.metadata-text:last-child) {
  margin-bottom: 0;
}

:deep(.text-restriction) {
  color: #bc1518;
}
</style>
