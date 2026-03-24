<template>
  <div v-if="licenseInfo" class="metadata-section metadata-license">
    <h2 v-if="showHeading" class="h5 metadata-title">{{ heading }}</h2>

    <div class="metadata-license-content">
      <div class="metadata-license-image">
        <img
          v-if="licenseImageUrl"
          :src="licenseImageUrl"
          :alt="`Licença Creative Commons ${licenseInfo.label}`"
          class="license-img"
        />
      </div>

      <div class="metadata-license-text">
        <p class="metadata-text" v-html="licenseText"></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

defineOptions({
  name: "LicenseInfoBlock",
});

const props = defineProps({
  /** Objeto retornado por `findLicenseByUrl` (label, url, image, text) */
  licenseInfo: {
    type: Object,
    default: null,
  },
  /** Exibe o título “Permissões de uso da imagem” (ex.: metadados). No modal, use `false`. */
  showHeading: {
    type: Boolean,
    default: true,
  },
  heading: {
    type: String,
    default: "Permissões de uso da imagem",
  },
});

const licenseImageUrl = computed(() => {
  if (!props.licenseInfo?.image) return null;

  return new URL(`../../assets/${props.licenseInfo.image}`, import.meta.url).href;
});

const licenseText = computed(() => {
  return props.licenseInfo?.text || "Informações sobre a licença não disponíveis.";
});
</script>

<style lang="scss" scoped>
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.metadata-section {
  padding: 1rem 0;
}

.metadata-title {
  margin-bottom: 1rem;
  color: #343a40;
}

.metadata-text {
  margin: 0;
  color: #495057;
  line-height: 1.6;
}

.metadata-license-content {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  align-items: center;
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
</style>
