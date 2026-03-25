<template>
  <div class="metadata-license-content">
    <div class="metadata-license-text metadata-license-text--full">
      <p class="metadata-text">
        Não foi possível identificar automaticamente a licença desta imagem.
      </p>
      <p class="metadata-text">
        <strong>Verifique os metadados antes de reutilizar.</strong>
      </p>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: "LicenseContentUnknown" });

defineProps({
  licenseInfo: {
    type: Object,
    default: null,
  },
});
</script>

<style scoped>
.metadata-license-content {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  align-items: center;
}

.metadata-license-text--full {
  flex: 1 1 100%;
  min-width: 0;
}

.metadata-text {
  margin: 0 0 0.5rem;
  color: #495057;
  line-height: 1.6;
}

.metadata-text:last-child {
  margin-bottom: 0;
}
</style>
