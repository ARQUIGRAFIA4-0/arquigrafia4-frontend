<script setup>
import { computed } from "vue";
import UploadImageBox from "@/components/UploadImageBox.vue";

const props = defineProps({
  userImages: {
    type: Array,
    default: () => [],
  },
  isCurrentUser: {
    type: Boolean,
    default: false,
  },
  userData: {
    type: Object,
    default: null,
  },
});

const firstName = computed(() => {
  if (props.userData && props.userData.name) {
    return props.userData.name.split(" ")[0];
  }
  return "Este usuário";
});
</script>

<template>
  <!-- Usuário visita o próprio perfil sem imagens -->
  <UploadImageBox v-if="props.userImages.length === 0 && props.isCurrentUser" />

  <!-- Usuário visita o perfil de outro usuário sem imagens -->
  <div v-else-if="props.userImages.length === 0 && !props.isCurrentUser">
    <div
      class="alert alert-dark bg-off-white alert-light border border-dark border-start-3 no-images-banner"
      role="alert"
    >
      <i class="bi bi-exclamation-circle-fill text-dark"></i>
      <span>{{ firstName }} ainda não tem imagens no Arquigrafia.</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/scss/variables" as *;

.no-images-banner {
  display: inline-flex;
  align-items: center;
  height: auto;
  padding: 0.5rem 1rem;
  word-break: break-word;

  i {
    margin-right: 0.5rem;
  }
}
</style>
