<script setup>
defineProps({
  instructionsTitle: {
    type: String,
    default: "Você ainda não<br />tem coleções.",
  },
  isCurrentUser: {
    type: Boolean,
    default: false,
  },
  userData: {
    type: Object,
    default: null,
  },
  variant: {
    type: String,
    default: "empty", // empty | compact
  },
});

const emit = defineEmits(["open-create"]);

function handleClick() {
  emit("open-create");
}


</script>

<template>

  <!-- Caixa de upload inicial -->
  <section
    v-if="variant === 'empty'"
    class="upload-collection-box"
    @click="handleClick"
  >
    <div class="upload-collection-box__content">
      <h2 class="upload-collection-box__title" v-html="instructionsTitle"></h2>
      <i class="bi bi-plus-circle-fill upload-collection-box__icon"></i>
      <p class="upload-collection-box__subtitle">clique aqui para criar uma</p>
    </div>
  </section>

  <button
    v-else
    type="button"
    class="upload-collection-box upload-collection-box--compact"
    @click="handleClick"
  >
    <span class="upload-collection-box__compact-inner">
      <svg
        class="upload-collection-box__compact-svg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 50 50"
        fill="none"
        aria-hidden="true"
      >
        <g clip-path="url(#clip0_upload_compact)">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M50 25C50 31.6304 47.3661 37.9893 42.6777 42.6777C37.9893 47.3661 31.6304 50 25 50C18.3696 50 12.0107 47.3661 7.32233 42.6777C2.63392 37.9893 0 31.6304 0 25C0 18.3696 2.63392 12.0107 7.32233 7.32233C12.0107 2.63392 18.3696 0 25 0C31.6304 0 37.9893 2.63392 42.6777 7.32233C47.3661 12.0107 50 18.3696 50 25ZM26.5625 14.0625C26.5625 13.6481 26.3979 13.2507 26.1049 12.9576C25.8118 12.6646 25.4144 12.5 25 12.5C24.5856 12.5 24.1882 12.6646 23.8951 12.9576C23.6021 13.2507 23.4375 13.6481 23.4375 14.0625V23.4375H14.0625C13.6481 23.4375 13.2507 23.6021 12.9576 23.8951C12.6646 24.1882 12.5 24.5856 12.5 25C12.5 25.4144 12.6646 25.8118 12.9576 26.1049C13.2507 26.3979 13.6481 26.5625 14.0625 26.5625H23.4375V35.9375C23.4375 36.3519 23.6021 36.7493 23.8951 37.0424C24.1882 37.3354 24.5856 37.5 25 37.5C25.4144 37.5 25.8118 37.3354 26.1049 37.0424C26.3979 36.7493 26.5625 36.3519 26.5625 35.9375V26.5625H35.9375C36.3519 26.5625 36.7493 26.3979 37.0424 26.1049C37.3354 25.8118 37.5 25.4144 37.5 25C37.5 24.5856 37.3354 24.1882 37.0424 23.8951C36.7493 23.6021 36.3519 23.4375 35.9375 23.4375H26.5625V14.0625Z"
            fill="#636262"
          />
        </g>
        <defs>
          <clipPath id="clip0_upload_compact">
            <rect width="50" height="50" fill="white" />
          </clipPath>
        </defs>
      </svg>
      <span class="upload-collection-box__compact-label">Criar coleção</span>
    </span>
  </button>

</template>

<style lang="scss" scoped>

.upload-collection-box.upload-collection-box--compact {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  border: 0.3px solid #636262;
  border-radius: 5px;
  background: #faf9f9;
  box-shadow: 1px 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.upload-collection-box__compact-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  max-width: 100%;
  min-width: 0;
}

.upload-collection-box__compact-svg {
  flex-shrink: 0;
  display: block;
  width: clamp(28px, 18%, 50px);
  height: clamp(28px, 18%, 50px);
}

.upload-collection-box__compact-label {
  margin: 0;
  max-width: 100%;
  padding: 0 2px;
  font-family: "DM Sans", sans-serif;
  font-size: clamp(11px, 3.4vw, 14px);
  font-weight: 500;
  line-height: 1.25;
  color: #636262;
  text-align: center;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.upload-collection-box__icon--compact {
  font-size: 50px;
  color: #636262;
}


// Caixa de upload inicial
.upload-collection-box {
  width: 100%;
  min-height: 515px;
  box-sizing: border-box;

  border: 2px solid #636262;
  border-radius: 7px;
  background: #faf9f9;
  box-shadow: 4px 4px 8px 0 rgba(0, 0, 0, 0.1);

  cursor: pointer;
  overflow: hidden;

  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-collection-box__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24.6px;
  text-align: center;
}

.upload-collection-box__title {
  margin: 0;
  color: #000;
  font-family: "DM Sans", sans-serif;
  font-size: 30px;
  font-style: normal;
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: 0;
  text-align: center;
}

.upload-collection-box__icon {
  color: #0f59a5;
  font-size: 50px;
  line-height: 1;
}

.upload-collection-box__subtitle {
  margin: 0;
  color: #000;
  font-family: "Istok Web", sans-serif;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 20px;
  text-align: center;
  text-transform: lowercase;
}

@media (max-width: 575px) {
  .upload-collection-box {
    min-height: 360px;
  }

  .upload-collection-box.upload-collection-box--compact {
    padding: 10px 6px;
  }

  .upload-collection-box__compact-inner {
    gap: 6px;
  }

  .upload-collection-box__compact-svg {
    width: 28px;
    height: 28px;
  }

  .upload-collection-box__compact-label {
    font-size: 11px;
    line-height: 1.2;
  }

  .upload-collection-box__title {
    font-size: 22px;
  }

  .upload-collection-box__icon {
    font-size: 32px;
  }
}

@media (min-width: 576px) and (max-width: 1023px) {
  .upload-collection-box__compact-svg {
    width: 36px;
    height: 36px;
  }

  .upload-collection-box__compact-label {
    font-size: 12px;
  }
}

</style>