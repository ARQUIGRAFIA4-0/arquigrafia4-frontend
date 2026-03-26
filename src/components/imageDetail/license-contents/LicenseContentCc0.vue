<template>

  <LicenseContentLayout :license-info="licenseInfo">
    <p class="metadata-text">
      Esta obra está em domínio público mundial.
    </p>
    <p class="metadata-text">
      A imagem pode ser reutilizada, distribuída, remixada, adaptada e utilizada para criação de obras derivadas.
    </p>
  </LicenseContentLayout>
  
</template>

<script setup>
import LicenseContentLayout from "./LicenseContentLayout.vue";

defineOptions({ name: "LicenseContentCc0" });

defineProps({
  licenseInfo: {
    type: Object,
    required: true,
  },
});
</script>
