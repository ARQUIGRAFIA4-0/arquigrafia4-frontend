<script setup>
import { computed, ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import { useAlbumsStore } from "@/store/albums";
import { useUsersStore } from "@/store/users";
import defaultProfileImage from "@/assets/profile_image.png";

defineOptions({ name: "CollectionDetail" });

const usersStore = useUsersStore();
const API_BASE_URL = import.meta.env.VITE_BASE_REQUEST_URL;

const ownerUser = ref(null);

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const albumsStore = useAlbumsStore();

const isLoadingOwner = ref(false);

const collectionId = computed(() => route.params.collectionId);

const albumData = ref(null);
const collectionError = ref("");

// título e descrição reais vindos da API
const collectionTitle = computed(() => {
  return albumData.value?.title?.trim() || "Sem título";
});

const collectionDescription = computed(() => {
  return albumData.value?.description?.trim() || "Sem descrição.";
});

// avatar do proprietário da coleção
const ownerAvatarSrc = computed(() => {
  const avatarUrl = ownerUser.value?.avatar_url;
  const avatarPath = ownerUser.value?.avatar_path;

  // Caso já venha URL completa da API/CDN
  if (avatarUrl && /^https?:\/\//.test(avatarUrl)) {
    return avatarUrl;
  }

  // Caso venha caminho relativo em avatar_url
  if (avatarUrl) {
    return `${API_BASE_URL}${avatarUrl.startsWith("/") ? "" : "/"}${avatarUrl}`;
  }

  // Caso backend retorne avatar_path (mesmo padrão do ProfileCard)
  if (avatarPath) {
    return `${API_BASE_URL}/storage/${avatarPath}`;
  }

  return defaultProfileImage;

});

// busca os dados da coleção
async function fetchCollectionData() {
  if (!collectionId.value) return;

  try {
    collectionError.value = "";

    const data = await albumsStore.getDataAlbumByAlbumId(
      authStore.authHeader,
      collectionId.value
    );

    albumData.value = data;

    if (data.user_id) {
      isLoadingOwner.value = true;

      try {
        ownerUser.value = await usersStore.getUser(data.user_id);
      } catch (e) {
        ownerUser.value = null;
      } finally {
        isLoadingOwner.value = false;
      }

    } else {
      ownerUser.value = null;
      isLoadingOwner.value = false;
      
    }

  } catch (error) {
    collectionError.value =
      error?.message || "Não foi possível carregar os dados da coleção.";
    albumData.value = null;

  }

}

onMounted(fetchCollectionData);

watch(
  () => route.params.collectionId,
  () => {
    fetchCollectionData();
  }
);

</script>

<template>
  <section class="collection-detail__container">
    <header class="collection-detail__header">
        <button
            type="button"
            class="collection-detail__back-btn"
            aria-label="Voltar"
            @click="router.back()"
        >
            <span class="collection-detail__back-content">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M13.1248 7.00055C13.1248 6.88452 13.0787 6.77324 12.9967 6.69119C12.9146 6.60915 12.8033 6.56305 12.6873 6.56305H2.36843L5.12206 3.8103C5.16273 3.76963 5.195 3.72134 5.21701 3.66819C5.23903 3.61504 5.25036 3.55808 5.25036 3.50055C5.25036 3.44303 5.23903 3.38606 5.21701 3.33292C5.195 3.27977 5.16273 3.23148 5.12206 3.1908C5.08138 3.15013 5.03309 3.11786 4.97994 3.09584C4.92679 3.07383 4.86983 3.0625 4.81231 3.0625C4.75478 3.0625 4.69782 3.07383 4.64467 3.09584C4.59152 3.11786 4.54323 3.15013 4.50256 3.1908L1.00256 6.6908C0.961813 6.73144 0.929488 6.77972 0.907432 6.83287C0.885376 6.88603 0.874023 6.94301 0.874023 7.00055C0.874023 7.0581 0.885376 7.11508 0.907432 7.16823C0.929488 7.22138 0.961813 7.26966 1.00256 7.3103L4.50256 10.8103C4.54323 10.851 4.59152 10.8832 4.64467 10.9053C4.69782 10.9273 4.75478 10.9386 4.81231 10.9386C4.86983 10.9386 4.92679 10.9273 4.97994 10.9053C5.03309 10.8832 5.08138 10.851 5.12206 10.8103C5.16273 10.7696 5.195 10.7213 5.21701 10.6682C5.23903 10.615 5.25036 10.5581 5.25036 10.5006C5.25036 10.443 5.23903 10.3861 5.21701 10.3329C5.195 10.2798 5.16273 10.2315 5.12206 10.1908L2.36843 7.43805H12.6873C12.8033 7.43805 12.9146 7.39196 12.9967 7.30991C13.0787 7.22786 13.1248 7.11658 13.1248 7.00055Z"
                    fill="#2F2F2F"
                />
                </svg>
                <span class="collection-detail__back-text">voltar</span>
            </span>
        </button>
    </header>
    <main class="collection-detail__main container-fluid px-0">
      <div class="row g-0 collection-detail__row">
        <div class="col-12 col-md-9">
          <section class="collection-detail__gallery">         
          </section>
        </div>
        <div class="col-12 col-md-3">
          <aside class="collection-detail__info-wrapper">
            <h1 class="collection-detail__title">{{ collectionTitle }}</h1>
            <p class="collection-detail__description">{{ collectionDescription }}</p>
          </aside>
          <section class="collection-detail__actors">
            <div class="collection-detail__actors-title-area">
              <h2 class="collection-detail__actors-title">Coleção criada por</h2>
            </div>
            <div class="collection-detail__actors-list">
              <div class="collection-detail__actor-image-area">
                <div
                  v-if="isLoadingOwner"
                  class="collection-detail__actor-image-skeleton"
                  aria-hidden="true"
                />
                <img
                  v-else
                  :src="ownerAvatarSrc"
                  :alt="`Avatar de ${ownerUser?.name?.trim() || 'usuário'}`"
                  class="collection-detail__actor-image"
                />
              </div>
              <div class="collection-detail__actor-name-wrapper">
                <div v-if="isLoadingOwner" class="collection-detail__actor-name-skeleton" />
                <p
                  v-else
                  class="collection-detail__actor-name"
                  :class="{ 'collection-detail__actor-name--visible': !isLoadingOwner }"
                >
                  {{ ownerUser?.name?.trim() || "Usuário desconhecido" }}
                </p>
                </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  </section>
</template>

<style scoped>

.collection-detail__actors {
  display: flex;
  height: 103px;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  align-self: stretch;
  padding: 0 12px;
}

.collection-detail__actors-title-area {
  display: flex;
  padding: var(--g, 24px) var(--p, 12px) 8px 0;
  align-items: center;
  gap: var(--p, 12px);
  align-self: stretch;
}

.collection-detail__actors-title {
  flex: 1 0 0;
  color: var(--Preto, #1F1F1F);
  font-family: "DM Sans";
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
}

.collection-detail__actors-list {
  display: flex;
  align-items: center;
  gap: var(--m, 16px);
  align-self: stretch;
}

.collection-detail__actor-image-area {
  display: flex;
  width: 40px;
  height: 40px;
  justify-content: center;
  align-items: center;
  aspect-ratio: 1/1;  
  background-color: var(--Cinza_C, #A6A6A6);
  border-radius: 50%;
}

.collection-detail__actor-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

.collection-detail__actor-image-skeleton {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #e8e8e8;
  animation: skeletonPulse 1.8s ease-in-out infinite;
}

.collection-detail__actor-name {
  color: var(--Preto, #1F1F1F);
  font-family: "DM Sans";
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
  margin: 0;
  opacity: 0;
  transform: translateY(2px);
  transition: opacity 220ms ease, transform 220ms ease;  
}

.collection-detail__actor-name--visible {
  opacity: 1;
  transform: translateY(0);
}

.collection-detail__container {
  width: 100%;
  min-height: calc(100dvh - var(--main-header-height, 272px));
  padding: 26px 24px;
  display: flex;
  flex-direction: column;
}
.collection-detail__main {
  width: 100%;
  margin-top: 16px;
  flex: 1 1 auto; /* empurra o final da página para baixo quando tiver pouco conteúdo */
}

.collection-detail__header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.collection-detail__back-btn {
  display: inline-flex;
  padding: 2px 14px;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  border-radius: 5px;
  border: 1px solid var(--Cinza_E, #2f2f2f);
  background: var(--Off_white, #faf9f9);
  cursor: pointer;
}

.collection-detail__back-content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.collection-detail__back-text {
  color: var(--Cinza_E, #2f2f2f);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 150%;
}

.collection-detail__main {
  width: 100%;
  margin-top: 16px;
}

.collection-detail__row {
  width: 100%;
  margin-left: 0;
  margin-right: 0;
}

.collection-detail__gallery {
  min-height: 320px;
  border-radius: 8px;
  background: #fff;
  margin-right: 12px;
}

.collection-detail__info-wrapper {
  display: flex;
  width: 338px;
  padding: 0 12px;
  flex-direction: column;
  align-items: flex-start;
}

.collection-detail__title {
  align-self: stretch;
  color: var(--Cinza_E, #2F2F2F);
  font-family: "DM Sans";
  font-size: 30px;
  font-style: normal;
  font-weight: 500;
  line-height: 115%; /* 34.5px */
}

.collection-detail__description {
  flex: 1 0 0;
  color: var(--Preto, #1F1F1F);
  font-family: "DM Sans";
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 125%; /* 17.5px */  
  padding-block: 8px;
}

.collection-detail__actor-name-skeleton {
  width: 140px;
  height: 22px;
  border-radius: 6px;
  background: #ececec;
  animation: skeletonPulse 1.8s ease-in-out infinite;
}

@keyframes skeletonPulse {
  0% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

@media (max-width: 767px) {
  .collection-detail__container {
    padding: 16px;
  }

  .collection-detail__gallery {
    margin-right: 0;
    margin-bottom: 12px;
  }
}
</style>