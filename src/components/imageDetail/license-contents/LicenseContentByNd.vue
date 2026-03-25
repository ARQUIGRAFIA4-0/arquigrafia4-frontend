<template>
  <LicenseContentLayout :license-info="licenseInfo">
    <p class="metadata-text">
      Esta imagem pode ser copiada, redistribuída, e utilizada para fins comerciais,
      desde que em sua forma original
      <span class="text-restriction">
        <strong>(não pode ser alterada ou remixada).</strong>
      </span>
    </p>
    <p class="metadata-text">
      No entanto, <strong>você deve dar o crédito apropriado</strong>.
    </p>
  </LicenseContentLayout>
</template>

<script setup>
import LicenseContentLayout from "./LicenseContentLayout.vue";

defineOptions({ name: "LicenseContentByNd" });

defineProps({
  licenseInfo: {
    type: Object,
    required: true,
  },
});
</script>
