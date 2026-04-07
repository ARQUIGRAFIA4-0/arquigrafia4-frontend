<script setup>
  import UploadColectionBox from "@/components/UploadColectionBox.vue";

  // Props
  const props = defineProps({
    isCurrentUser: { type: Boolean, default: false },
    userData: { type: Object, default: null },
  });

</script>

<template>
  <section class="profile-collections">
    <UploadColectionBox
      :is-current-user="props.isCurrentUser"
      :user-data="props.userData"
    />
  </section>
</template>

<style scoped>
.profile-collections {
  width: 100%;
}
</style>