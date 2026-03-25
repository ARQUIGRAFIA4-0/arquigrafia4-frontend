<template>
  <div v-if="licenseInfo" class="metadata-section metadata-license">
    <h2 v-if="showHeading" class="h5 metadata-title">{{ heading }}</h2>

    <component :is="contentComponent" :license-info="licenseInfo" />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { getLicenseContentComponent } from "@/components/imageDetail/license-contents/licenseContentRegistry";

defineOptions({
  name: "LicenseInfoBlock",
});

const props = defineProps({
  /** Objeto retornado por `findLicenseByUrl` (`label`, `url`, `image`) */
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

const contentComponent = computed(() =>
  props.licenseInfo ? getLicenseContentComponent(props.licenseInfo) : null
);
</script>

<style lang="scss" scoped>
.metadata-section {
  padding: 1rem 0;
}

.metadata-title {
  margin-bottom: 1rem;
  color: #343a40;
}
</style>
