<script setup>
  import UploadColectionBox from "@/components/UploadColectionBox.vue";

  // Props
  defineProps({
      isCurrentUser: { type: Boolean, default: false },
      userData: { type: Object, default: null },
  });

</script>

<template>
  <section class="profile-collections">
    <UploadColectionBox />
  </section>
</template>

<style scoped>
.profile-collections {
  width: 100%;
}
</style>