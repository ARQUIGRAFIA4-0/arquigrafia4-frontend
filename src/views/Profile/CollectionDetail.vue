<script setup>
import { computed } from "vue";

defineOptions({ name: "CollectionDetail" });

// id da coleção vindo da rota
const collectionId = computed(() => route.params.collectionId);

// Estrutura básica (mock)
// Depois você substitui por dados reais da API/store
const collectionTitle = computed(() => `Coleção #${collectionId.value}`);
const images = computed(() => []);

</script>

<template>

</template>

<style scoped>

</style>