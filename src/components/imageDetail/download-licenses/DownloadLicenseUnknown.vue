<template>
  <section class="license-content" aria-label="Permissões de uso não identificadas">
    <div class="license-content__icon">
      <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
    </div>

    <div class="license-content__body">
      <p class="license-content__title">Licença não identificada</p>
      <p class="license-content__text">
        Não foi possível identificar automaticamente a licença desta imagem.
      </p>
      <p class="license-content__text">
        <strong>Verifique os metadados antes de reutilizar.</strong>
      </p>
    </div>
  </section>
</template>

<script setup>
defineOptions({ name: "DownloadLicenseUnknown" });

defineProps({
  image: {
    type: Object,
    default: null,
  },
  license: {
    type: Object,
    default: null,
  },
});
</script>

<style scoped>
.license-content {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.license-content__icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bc1518;
}

.license-content__icon .bi {
  font-size: 1.5rem;
}

.license-content__body {
  flex: 1;
}

.license-content__title {
  margin: 0 0 8px;
  font-weight: 700;
}

.license-content__text {
  margin: 0 0 8px;
  line-height: 1.5;
}

.license-content__text:last-child {
  margin-bottom: 0;
}
</style>
