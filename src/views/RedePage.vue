<template>
  <section class="user-grid">
    <UserCard />
    <ColletiveCardRede />
  </section>
</template>

<script setup>


import ColletiveCardRede from '../components/rede/ColletiveCardRede.vue';
import UserCard from '../components/rede/UserCardRede.vue';



</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

.user-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;

}
</style>