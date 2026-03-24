<template>
  <section class="license-content" aria-label="Permissões da licença CC BY-NC-SA">
    <div class="license-content__icon">
      <!-- TODO: trocar pelo ícone final da licença -->
      <i class="bi bi-info-circle" aria-hidden="true"></i>
    </div>

    <div class="license-content__body">
      <p class="license-content__title">Licença CC BY-NC-SA</p>
      <p class="license-content__text">
        content BY-NC-SA.
      </p>
    </div>
  </section>
</template>

<script setup>
defineOptions({ name: "DownloadLicenseByNcSa" });

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
  margin: 0;
  line-height: 1.5;
}
</style>
