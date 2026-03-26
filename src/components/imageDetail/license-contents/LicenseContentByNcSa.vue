<template>

  <LicenseContentLayout :license-info="licenseInfo">
    <p class="metadata-text">
      Esta imagem pode ser copiada, redistribuida, e adaptada (o que inclui:
      remixar, transformar, e criar a partir do material), no entanto,
      <strong>você deve dar o crédito apropriado</strong>, prover um link para
      <strong>o mesmo tipo de licença</strong> e indicar se mudanças foram feitas.
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

defineOptions({ name: "LicenseContentByNcSa" });

defineProps({
  licenseInfo: {
    type: Object,
    required: true,
  },
});
</script>
