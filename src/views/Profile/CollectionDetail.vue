<script setup>
import { computed, ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import { useAlbumsStore } from "@/store/albums";
import { useUsersStore } from "@/store/users";
import defaultProfileImage from "@/assets/profile_image.png";
import CollectionPeriodsChart from "@/components/CollectionPeriodsChart.vue";

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
    console.log(data.description);
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

/** Tags inferidas só a partir do texto da API (não usar o fallback "Sem descrição.") */
const collectionTags = computed(() =>
  ["Fruição urbana", "Modernismo", "Paisagem", "Coletivo", "Espaço público"]
  //collectionTagsFromDescription(albumData.value?.description ?? "")
);

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
          <section
            v-if="collectionTags.length"
            class="collection-detail__tags-block"
            aria-labelledby="collection-tags-heading"
          >
            <div class="collection-detail__tags-heading-row">
              <h2 id="collection-tags-heading" class="collection-detail__tags-title">
                Tags na coleção
              </h2>
              <button
                type="button"
                class="collection-detail__tags-help btn btn-link p-0"
                aria-label="Sobre as tags da coleção"
                title="Estas etiquetas são geradas automaticamente a partir do texto da descrição da coleção."
              >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 12 12" fill="none">
                <g clip-path="url(#clip0_7792_53529)">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M12 6C12 7.5913 11.3679 9.11742 10.2426 10.2426C9.11742 11.3679 7.5913 12 6 12C4.4087 12 2.88258 11.3679 1.75736 10.2426C0.632141 9.11742 0 7.5913 0 6C0 4.4087 0.632141 2.88258 1.75736 1.75736C2.88258 0.632141 4.4087 0 6 0C7.5913 0 9.11742 0.632141 10.2426 1.75736C11.3679 2.88258 12 4.4087 12 6ZM4.122 4.52475C4.09782 4.52508 4.07384 4.52047 4.0515 4.51121C4.02917 4.50195 4.00896 4.48823 3.99211 4.47089C3.97526 4.45354 3.96213 4.43295 3.95351 4.41036C3.94489 4.38777 3.94098 4.36366 3.942 4.3395C4.0125 3.06825 5.05275 2.625 6.00375 2.625C7.05075 2.625 8.00775 3.1725 8.00775 4.305C8.00775 5.115 7.5315 5.5005 7.07475 5.84775C6.522 6.267 6.31725 6.42375 6.31725 6.96225V7.041C6.31725 7.09073 6.2975 7.13842 6.26233 7.17358C6.22717 7.20875 6.17948 7.2285 6.12975 7.2285H5.52225C5.47304 7.22851 5.4258 7.20916 5.39072 7.17465C5.35564 7.14013 5.33554 7.09321 5.33475 7.044L5.33175 6.88125C5.30325 6.186 5.703 5.75775 6.20775 5.391C6.65025 5.058 6.9315 4.839 6.9315 4.36275C6.9315 3.744 6.4605 3.48675 5.946 3.48675C5.34375 3.48675 5.00625 3.84525 4.9395 4.33725C4.926 4.44 4.8435 4.52475 4.74 4.52475H4.12125H4.122ZM5.86575 9.357C5.42775 9.357 5.109 9.0615 5.109 8.66175C5.109 8.24775 5.42775 7.95675 5.8665 7.95675C6.32325 7.95675 6.6375 8.24775 6.6375 8.66175C6.6375 9.0615 6.3225 9.357 5.86575 9.357Z" fill="#2F2F2F"/>
                </g>
                <defs>
                  <clipPath id="clip0_7792_53529">
                    <rect width="12" height="12" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
              </button>
            </div>
            <div class="metadata-tags">
              <button
                v-for="(tag, index) in collectionTags"
                :key="`${tag}-${index}`"
                type="button"
                class="btn btn-outline-primary btn-sm btn-tag"
              >
                {{ tag }}
              </button>
            </div>
          </section>
          <section
            class="collection-detail__periods-block"
            aria-labelledby="collection-periods-heading"
          >
            <div class="collection-detail__periods-heading-row">
              <h2 id="collection-periods-heading" class="collection-detail__periods-title">
                Períodos da coleção
              </h2>
              <button
                type="button"
                class="collection-detail__periods-help btn btn-link p-0"
                aria-label="Sobre os períodos da coleção"
                title="Distribuição temporal das obras desta coleção (em construção)."
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <g clip-path="url(#clip_collection_periods_help)">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 6C12 7.5913 11.3679 9.11742 10.2426 10.2426C9.11742 11.3679 7.5913 12 6 12C4.4087 12 2.88258 11.3679 1.75736 10.2426C0.632141 9.11742 0 7.5913 0 6C0 4.4087 0.632141 2.88258 1.75736 1.75736C2.88258 0.632141 4.4087 0 6 0C7.5913 0 9.11742 0.632141 10.2426 1.75736C11.3679 2.88258 12 4.4087 12 6ZM4.122 4.52475C4.09782 4.52508 4.07384 4.52047 4.0515 4.51121C4.02917 4.50195 4.00896 4.48823 3.99211 4.47089C3.97526 4.45354 3.96213 4.43295 3.95351 4.41036C3.94489 4.38777 3.94098 4.36366 3.942 4.3395C4.0125 3.06825 5.05275 2.625 6.00375 2.625C7.05075 2.625 8.00775 3.1725 8.00775 4.305C8.00775 5.115 7.5315 5.5005 7.07475 5.84775C6.522 6.267 6.31725 6.42375 6.31725 6.96225V7.041C6.31725 7.09073 6.2975 7.13842 6.26233 7.17358C6.22717 7.20875 6.17948 7.2285 6.12975 7.2285H5.52225C5.47304 7.22851 5.4258 7.20916 5.39072 7.17465C5.35564 7.14013 5.33554 7.09321 5.33475 7.044L5.33175 6.88125C5.30325 6.186 5.703 5.75775 6.20775 5.391C6.65025 5.058 6.9315 4.839 6.9315 4.36275C6.9315 3.744 6.4605 3.48675 5.946 3.48675C5.34375 3.48675 5.00625 3.84525 4.9395 4.33725C4.926 4.44 4.8435 4.52475 4.74 4.52475H4.12125H4.122ZM5.86575 9.357C5.42775 9.357 5.109 9.0615 5.109 8.66175C5.109 8.24775 5.42775 7.95675 5.8665 7.95675C6.32325 7.95675 6.6375 8.24775 6.6375 8.66175C6.6375 9.0615 6.3225 9.357 5.86575 9.357Z" fill="#2F2F2F"/>
                  </g>
                  <defs>
                    <clipPath id="clip_collection_periods_help">
                      <rect width="12" height="12" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
              </button>
            </div>
            <CollectionPeriodsChart aria-label="Gráfico de períodos da coleção" />
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
  padding: var(--g, 12px) var(--p, 12px) 8px 0;
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
  min-height: 0;
  padding: 26px 24px;
  display: flex;
  flex-direction: column;
}

.collection-detail__main {
  width: 100%;
  margin-top: 16px;
  flex: 0 0 auto;
}

.collection-detail__header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.collection-detail__back-btn {
  display: inline-flex;
  padding: 4px 14px;
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

.collection-detail__tags-block {
  display: flex;
  max-width: 600px;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--p, 12px);
  align-self: stretch;
  padding: 0 12px;
}

.collection-detail__tags-heading-row {
  display: flex;
  padding: var(--g, 22px) var(--p, 12px) 8px 0;
  align-items: center;
  gap: var(--p, 12px);
  align-self: stretch;
}

.collection-detail__tags-title {
  margin: 0;
  flex: 1 0 0;
  color: var(--Preto, #1f1f1f);
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-weight: 500;
  line-height: 150%;
}

.collection-detail__tags-help {
  width: 12px;
  aspect-ratio: 1/1;
}

.collection-detail__tags-help:hover {
  color: var(--Preto, #1f1f1f);
}

/* Igual ao bloco de tags em ImageMetadata.vue (scoped lá — repetir aqui) */
.metadata-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  max-width: 395px;
}

.metadata-tags .btn-tag {
  min-height: 36px;
  cursor: pointer;
}

.collection-detail__periods-block {
  display: flex;
  max-width: 600px;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
  padding: 0 12px;
}

.collection-detail__periods-heading-row {
  display: flex;
  padding: var(--g, 24px) var(--p, 12px) 8px 0;
  align-items: center;
  gap: var(--p, 12px);
  align-self: stretch;
}

.collection-detail__periods-title {
  flex: 1 0 0;
  color: var(--Preto, #1F1F1F);
  font-family: "DM Sans";
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
}

.collection-detail__periods-help {
  width: 12px;
  aspect-ratio: 1/1;
}

.collection-detail__periods-help:hover {
  color: var(--Preto, #1f1f1f);
}

</style>