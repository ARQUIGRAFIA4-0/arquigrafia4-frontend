<script setup>
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';

const router = useRouter();

// Quando tiver design de página 404,
// remover este onMounted e adicionar template customizado
onMounted(() => {
  router.replace('/');
});
</script>

<template>
  <div></div>
</template>

<style lang="scss" scoped>
</style>
