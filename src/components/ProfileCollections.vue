<script setup>

    // Props
    defineProps({
        isCurrentUser: { type: Boolean, default: false },
        userData: { type: Object, default: null },
    });

</script>

<template>
  <section class="profile-collections">
    <h2 class="profile-collections__title">Minhas coleções</h2>
    <p class="profile-collections__empty">Você ainda não tem coleções.</p>
  </section>
</template>

<style scoped>
.profile-collections__title {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 500;
}
.profile-collections__empty {
  margin: 0;
  font-size: 14px;
}
</style>