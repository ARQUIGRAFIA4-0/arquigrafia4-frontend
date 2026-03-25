<template>
  <LicenseContentLayout :license-info="licenseInfo">
    <p class="metadata-text">
      Esta imagem pode ser copiada, redistribuída, e adaptada (o que inclui:
      remixar, transformar, e criar a partir do material), e utilizada para fins
      comerciais.
    </p>
    <p class="metadata-text">
      No entanto, <strong>você deve dar o crédito apropriado</strong>, prover um link
      para <strong>o mesmo tipo de licença</strong>, e indicar se mudanças foram
      feitas.
    </p>
  </LicenseContentLayout>
</template>

<script setup>
import LicenseContentLayout from "./LicenseContentLayout.vue";

defineOptions({ name: "LicenseContentBySa" });

defineProps({
  licenseInfo: {
    type: Object,
    required: true,
  },
});
</script>
