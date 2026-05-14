<template>
  <section class="user-grid">
    <UserCard />
    <ColletiveCardRede />

    <div class="network-toolbar-container">
      <NetworkToolbar @search="onSearch" />
    </div>

    <div class="teste"></div>
  </section>
</template>

<script setup>

import ColletiveCardRede from '../components/network/ColletiveCardNetwork.vue';
import UserCard from '../components/network/UserCardNetwork.vue';
import NetworkToolbar from '../components/network/NetworkToolbar.vue';

function onSearch({ filter, sort, query }) {
  // filter: "todos" | "pessoas" | "coletivos"
  // sort:   "a-z" | "z-a" | "mais-recentes" | "mais-antigas"
  // query:  string
  console.log({ filter, sort, query });

}

</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

.user-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.network-toolbar-container {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  max-width: fit-content;
  z-index: 1000;
}

.teste {
  background-color: slategray;
  width: 100%;
  height: 500px;
}
</style>