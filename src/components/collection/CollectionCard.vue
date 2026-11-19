<script setup>
import UiCard from "@/components/ui/UiCard.vue";
import AlbumCoverArt from "@/components/AlbumCoverArt.vue";
import CollectionCardLabels from "@/components/CollectionCardLabels.vue";

defineProps({
  album: { type: Object, required: true },
});

const emit = defineEmits(["open"]);
</script>

<template>
  <div class="profile-grid-card__link" @click="emit('open', album)">
    <UiCard class="profile-grid-card profile-grid-card--collection">
      <template #image>
        <div class="profile-grid-card__image-wrapper">
          <AlbumCoverArt :album="album" class="profile-grid-card__image" />
        </div>
      </template>

      <div class="ui-card__header">
        <h3 class="ui-card__title" :title="album.title || 'Sem título'">
          {{ album.title || "Sem título" }}
        </h3>
        <div class="profile-grid-card__meta">
          <CollectionCardLabels :album="album" class="profile-grid-card__labels" />
          <button
            type="button"
            class="profile-grid-card__go-btn"
            :aria-label="`Ir para a coleção ${album.title || 'Sem título'}`"
            @click.stop="emit('open', album)"
          >
            Ir para coleção
            <i class="bi bi-arrow-right" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </UiCard>
  </div>
</template>

<style lang="scss" scoped>
@use "@/scss/profile-grid-card.scss";
</style>
