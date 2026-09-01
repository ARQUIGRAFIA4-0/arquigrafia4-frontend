<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";
import FitTags from "@/views/Profile/FitTags.vue";
import { formatImageDate } from "@/helpers/formatImageDate";

defineOptions({ name: "ImageGridCard" });

const props = defineProps({
  item: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  showTags: { type: Boolean, default: true },
  clickableTags: { type: Boolean, default: false },
  tagGap: { type: Number, default: 4 },
  titleTo: { type: [String, Object], default: null },
});

const emit = defineEmits(["image-error", "tag-click"]);

const formattedDate = computed(() => formatImageDate(props.item?.dates));
</script>

<template>
  <article
    class="image-grid-card"
    :class="{ 'image-grid-card--selected': selected }"
  >
    <div class="image-grid-card__image-wrapper">
      <slot name="image-overlay" />
      <img
        :src="item.imageUrl"
        class="image-grid-card__image"
        :alt="item.title"
        :data-test-image="item.id"
        @error="emit('image-error', $event)"
      />
    </div>

    <div class="image-grid-card__content">
      <div class="image-grid-card__text">
        <component
          :is="titleTo ? RouterLink : 'div'"
          :to="titleTo || undefined"
          class="image-grid-card__title-link"
          @click.stop
        >
          <h3 class="image-grid-card__title">{{ item.title }}</h3>
        </component>

        <p v-if="formattedDate" class="image-grid-card__date">
          <span class="image-grid-card__date-text">{{ formattedDate }}</span>
        </p>
      </div>

      <div class="image-grid-card__footer">
        <div
          v-if="showTags && item.subjects?.length"
          class="image-grid-card__tags"
        >
          <FitTags
            :subjects="item.subjects"
            :gap="tagGap"
            :clickable="clickableTags"
            @tag-click="emit('tag-click', $event)"
          />
        </div>

        <slot name="footer" />
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.image-grid-card {
  display: flex;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  flex-direction: column;
  align-items: stretch;
  gap: var(--pp, 8px);
  padding-bottom: var(--pp, 8px);
  border-radius: 5px;
  border: 0.25px solid var(--Cinza_C, #a6a6a6);
  background: var(--Off_white, #faf9f9);
  box-shadow: 1px 1px 3px 2px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.image-grid-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
}

.image-grid-card--selected {
  background: var(--Laranja_C, #f3e7dc);
}

.image-grid-card__image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background-color: #f8f9fa;
}

.image-grid-card__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-grid-card__content {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  padding: 14px 14px 4px;
}

.image-grid-card__text {
  display: flex;
  flex-direction: column;
  align-self: stretch;
  min-width: 0;
}

.image-grid-card__title-link {
  color: inherit;
  text-decoration: none;
  align-self: stretch;
  min-width: 0;
}

.image-grid-card__title {
  margin: 0;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  align-self: stretch;
  overflow: hidden;
  color: var(--Preto, #1f1f1f);
  text-overflow: ellipsis;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 700;
  line-height: 125%;
}

.image-grid-card__date {
  display: flex;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  margin: 2px 0 0;
  min-width: 0;
}

.image-grid-card__date-text {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  color: var(--Cinza_E, #2f2f2f);
  text-overflow: ellipsis;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 125%;
}

.image-grid-card__footer {
  margin-top: auto;
  width: 100%;
}

.image-grid-card__tags {
  width: 100%;
  padding-top: 8px;
}
</style>
