<template>

  <LicenseContentLayout :license-info="licenseInfo" :show-image="true">
      <p class="metadata-text">
        Esta imagem pode ser copiada, redistribuída, desde que em sua forma original
        <span class="text-restriction">
          <strong>(não pode ser alterada ou remixada).</strong>
        </span>
      </p>
      <p class="metadata-text">
        <strong>Você deve dar o crédito apropriado.</strong>
      </p>
      <p class="metadata-text">
        Esta imagem
        <span class="text-restriction">
          <strong>não pode ser utilizada para fins comerciais.</strong>
        </span>
      </p>
  </LicenseContentLayout>
  
</template>

<script setup>
import LicenseContentLayout from "./LicenseContentLayout.vue";

defineOptions({ name: "LicenseContentByNcNd" });

defineProps({
  licenseInfo: {
    type: Object,
    required: true,
  },
});
</script>
