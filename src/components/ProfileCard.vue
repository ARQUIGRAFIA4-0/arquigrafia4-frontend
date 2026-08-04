<script setup>
import { ref, computed, watch } from "vue";
import { useInitialSkeleton } from "@/composables/useInitialSkeleton";
import profileImageDefault from '@/assets/profile_image.png';

const props = defineProps({
  userData: { type: Object, default: null },
  profileData: { type: Object, default: null },
  isMobile: { type: Boolean, default: false },
  isOwnProfile: { type: Boolean, default: false }
});

const API_BASE_URL = import.meta.env.VITE_BASE_REQUEST_URL;

const showFullProfile = ref(false);

const { hasLoaded, finishInitialLoad, reset: resetInitialSkeleton } = useInitialSkeleton();
const loadStartedAt = ref(Date.now());

const showSkeleton = computed(() => !hasLoaded.value);

async function tryFinishInitialLoad() {
  if (hasLoaded.value || !props.userData || !props.profileData) return;
  await finishInitialLoad(loadStartedAt.value);
}

watch(
  () => [props.userData, props.profileData],
  () => {
    tryFinishInitialLoad();
  },
  { immediate: true }
);

watch(
  () => props.userData?.id,
  (newId, oldId) => {
    if (oldId !== undefined && newId !== oldId) {
      resetInitialSkeleton();
      loadStartedAt.value = Date.now();
    }
  }
);

const currentProfileData = computed(() => {
  return props.profileData || {};
});

watch(() => props.isMobile, (newValue) => {
  if (!newValue) {
    showFullProfile.value = true;
  }
}, { immediate: true });

function getColumns(keys) {
  const data = currentProfileData.value || {};
  return keys.filter(key => Boolean(data[key])).length;
}

function getAge(birthdate) {
  if (!birthdate) return "";
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function checkSocials(socials) {
  if (!socials) return false;
  return Object.values(socials).some(val => !!val);
}
</script>

<template>
  <div class="profile-card">
    <!-- Skeleton com tempo mínimo (mesmo padrão das tabs Imagens/Coleções) -->
    <div
      v-if="showSkeleton"
      class="profile-card__skeleton"
      aria-busy="true"
      aria-label="Carregando perfil"
    >
      <div class="profile-card__header">
        <div class="profile-card__image profile-card__image--skeleton">
          <div class="profile-card__skeleton-avatar"></div>
        </div>
        <div class="profile-card__title">
          <div class="profile-card__skeleton-name"></div>
          <div class="profile-card__address">
            <div class="profile-card__skeleton-location"></div>
          </div>
        </div>
      </div>
      <div v-if="!isMobile" class="profile-card__skeleton-content">
        <div class="profile-card__skeleton-block profile-card__skeleton-block--label"></div>
        <div class="profile-card__skeleton-block profile-card__skeleton-block--value"></div>
        <div class="profile-card__skeleton-block profile-card__skeleton-block--label"></div>
        <div class="profile-card__skeleton-icons">
          <div class="profile-card__skeleton-icon"></div>
        </div>
        <div class="profile-card__skeleton-block profile-card__skeleton-block--label"></div>
        <div class="profile-card__skeleton-tags">
          <div class="profile-card__skeleton-tag"></div>
          <div class="profile-card__skeleton-tag profile-card__skeleton-tag--short"></div>
        </div>
        <div class="profile-card__skeleton-button"></div>
      </div>
    </div>

    <!-- Conteúdo real após carga inicial -->
    <div v-else class="profile-card__loaded">
      <div class="profile-card__header">
        <div class="profile-card__image">
          <!-- <img :src="currentProfileData?.profile_image || profileImageDefault" alt="Foto de perfil" /> -->
          <img :src="props.userData.avatar_url
            ? (props.userData.avatar_url.startsWith('http') ? props.userData.avatar_url : `${API_BASE_URL}${props.userData.avatar_url}`)
            : (props.userData.avatar_path ? `${API_BASE_URL}/storage/${props.userData.avatar_path}` : profileImageDefault)"
            alt="Foto de perfil" />
        </div>
        <div class="profile-card__title">
          <h2>{{ userData?.name }}</h2>
          <div class="profile-card__address">
            <i class="bi bi-geo-alt"></i>
            <p>{{ currentProfileData?.address || "Não informado" }}</p>
          </div>
        </div>
      </div>
      <div v-if="showFullProfile" class="profile-card__content">
        <div v-if="currentProfileData?.bio" class="profile-card__bio">
          <h3>Bio</h3>
          <p>{{ currentProfileData.bio }}</p>
        </div>
        <div v-if="getColumns(['gender', 'birthdate', 'race']) > 0"
          :class="getColumns(['gender', 'birthdate', 'race']) === 3 ? 'row row-cols-3' : 'row row-cols-2'">
          <div v-if="currentProfileData?.gender" class="col">
            <h3>Gênero</h3>
            <p>{{ currentProfileData.gender }}</p>
          </div>
          <div v-if="currentProfileData?.birthdate" class="col">
            <h3>Idade</h3>
            <p>{{ getAge(currentProfileData.birthdate) }} anos</p>
          </div>
          <div v-if="currentProfileData?.race" class="col">
            <h3>Raça</h3>
            <p>{{ currentProfileData.race }}</p>
          </div>
        </div>
        <div v-if="getColumns(['profession', 'scholarity']) > 0" class="row row-cols-2">
          <div v-if="currentProfileData?.profession" class="col">
            <h3>Profissão</h3>
            <p>{{ currentProfileData.profession }}</p>
          </div>
          <div v-if="currentProfileData?.scholarity" class="col">
            <h3>Escolaridade</h3>
            <p>{{ currentProfileData.scholarity }}</p>
          </div>
        </div>
        <div v-if="checkSocials(currentProfileData?.socials)" class="profile-card__socials">
          <h3>Redes</h3>
          <div class="profile-card__socials-icons">
            <div v-if="currentProfileData?.socials.lattes">
              <a :href="currentProfileData.socials.lattes" target="_blank" rel="noopener noreferrer">
                <img src="@/assets/logo_lattes.svg" alt="Lattes" />
              </a>
            </div>
            <div v-if="currentProfileData?.socials.orcid">
              <a :href="currentProfileData.socials.orcid" target="_blank" rel="noopener noreferrer">
                <img src="@/assets/logo_orcid.svg" alt="Orcid" />
              </a>
            </div>
            <div v-if="currentProfileData?.socials.facebook">
              <a :href="currentProfileData.socials.facebook" target="_blank" rel="noopener noreferrer">
                <img src="@/assets/logo_facebook.svg" alt="Facebook" />
              </a>
            </div>
            <div v-if="currentProfileData?.socials.instagram">
              <a :href="currentProfileData.socials.instagram" target="_blank" rel="noopener noreferrer">
                <img src="@/assets/logo_instagram.svg" alt="Instagram" />
              </a>
            </div>
            <div v-if="currentProfileData?.socials.linkedin">
              <a :href="currentProfileData.socials.linkedin" target="_blank" rel="noopener noreferrer">
                <img src="@/assets/logo_linkedin.svg" alt="LinkedIn" />
              </a>
            </div>
            <div v-if="currentProfileData?.socials.whatsapp">
              <a :href="`https://wa.me/${currentProfileData.socials.whatsapp}`" target="_blank"
                rel="noopener noreferrer">
                <img src="@/assets/logo_whatsapp.svg" alt="WhatsApp" />
              </a>
            </div>
            <div v-if="currentProfileData?.socials.x">
              <a :href="currentProfileData.socials.x" target="_blank" rel="noopener noreferrer">
                <img src="@/assets/logo_x.svg" alt="X" />
              </a>
            </div>
          </div>
        </div>
        <div v-if="currentProfileData?.subjects?.length > 0" class="profile-card__interests">
          <h3>Interesses</h3>
          <ul class="profile-card__interests-list">
            <li v-for="subject in currentProfileData.subjects" :key="subject.id"
              class="btn btn-outline-secondary btn-sm btn-tag d-inline-flex align-items-center">
              {{ subject.term }}
            </li>
          </ul>
        </div>
        <div v-if="currentProfileData?.collectives?.length > 0" class="profile-card__collectives">
          <h3>Coletivos</h3>
          <div class="profile-card__collectives-avatars">
            <a
              v-for="collective in currentProfileData.collectives"
              :key="collective.id"
              class="profile-card__collective-avatar"
              :href="`/coletivos/${collective.id}`"
              :aria-label="collective.name"
            >
              <img
                v-if="collective.avatar_url"
                :src="collective.avatar_url.startsWith('http') ? collective.avatar_url : `${API_BASE_URL}${collective.avatar_url}`"
                :alt="collective.name"
              />
              <span v-else>{{ collective.name?.charAt(0).toUpperCase() }}</span>
              <span class="profile-card__collective-tooltip">{{ collective.name }}</span>
            </a>
          </div>
        </div>
        <div v-if="props.isOwnProfile" class="profile-card__toggle-profile-visibility">
          <a :href="`/perfil/${userData?.id}`" target="_blank" class="btn btn-secondary btn-sm btn-icon">
            <i class="bi bi-eye" /> Ver perfil público
          </a>
        </div>
      </div>
      <div class="profile-card__chevron-icon" v-if="isMobile">
        <i :class="[
          showFullProfile ? 'bi bi-chevron-compact-up' : 'bi bi-chevron-compact-down',
          'chevron-icon'
        ]" @click="showFullProfile = !showFullProfile" aria-label="Mostrar mais"></i>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.profile-card {
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
  background-color: #faf9f9;
  border-radius: 16px;
  padding: 24px 16px;
  box-shadow: 1px 1px 4px 1px #0000001A;
  margin-bottom: 40px;

  @include md {
    padding: 24px 24px;
    margin-bottom: 0px;
  }

  &__header {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 8px;

    @include md {
      gap: 0;
      margin-bottom: 16px;
    }
  }

  &__image {
    width: 70px;
    height: 70px;
    background-color: $color-laranja-e;
    border-radius: 10px;
    overflow: hidden;
    padding: 0;

    @include md {
      margin-bottom: 12px
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      padding: 0;
    }
  }

  &__title {
    display: flex;
    flex-direction: column;
    align-items: center;

    h2 {
      font-family: "DM Sans";
      font-weight: 500;
      font-style: Medium;
      font-size: 16px;
      line-height: 150%;
      letter-spacing: 0%;
      text-align: center;

      @include md {
        font-size: 20px;
      }
    }
  }

  &__address {
    display: flex;
    flex-direction: row;
    gap: 5px;

    p {
      color: $color-cinza-m;
      font-family: "DM Sans";
      font-weight: 400;
      font-style: 9pt Regular;
      font-size: 12px;
      line-height: 115%;
      letter-spacing: 0%;

      @include md {
        font-size: 14px;
        margin-bottom: 0;
      }
    }

    .bi-geo-alt {
      font-size: 12px;
      color: #636262;
    }
  }

  &__content {
    >*+* {
      margin-top: 30px;
    }

    margin-bottom: 30px;

    h3 {
      color: #636262;
      font-weight: 700;
      font-size: 16px;
      line-height: 115%;
      letter-spacing: 0%;
    }

    p {
      color: #636262;
      font-weight: 300;
      font-size: 14px;
      line-height: 125%;
      letter-spacing: 0%;
      margin-bottom: 0;
    }
  }

  &__socials {
    display: flex;
    flex-direction: column;
    align-items: center;

    >*+* {
      margin-top: 8px;
    }
  }

  &__socials-icons {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    row-gap: 15px;
    justify-content: center;

    img {
      width: 20px;
      height: 20px;
    }
  }

  &__interests {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__interests-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
    list-style: none;
    padding: 0;
    margin-top: 8px;
    overflow: hidden;
    min-width: 0;
    max-width: 100%;

    .btn {
      cursor: default;
      white-space: normal;
      word-break: break-word;
      overflow-wrap: anywhere;
      text-align: center;
      max-width: 100%;
    }

    li {
      max-width: 100%;
      word-break: break-word;
      overflow-wrap: anywhere;
      white-space: normal;

      @include md {
        font-size: 12px;
      }
    }
  }

  &__collectives {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 16px !important;

    >*+* {
      margin-top: 8px;
    }
  }

  &__collectives-avatars {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
  }

  &__collective-avatar {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: visible;
    background-color: $color-laranja-e;
    cursor: pointer;
    text-decoration: none;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.8;

      .profile-card__collective-tooltip {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(0);
      }
    }

    img {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
      object-position: center;
    }

    span:not(.profile-card__collective-tooltip) {
      color: #fff;
      font-family: "DM Sans";
      font-weight: 700;
      font-size: 20px;
      line-height: 1;
      user-select: none;
    }
  }

  &__collective-tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%) translateY(4px);
    background-color: #333;
    color: #fff;
    font-size: 12px;
    font-family: "DM Sans";
    white-space: nowrap;
    padding: 4px 8px;
    border-radius: 4px;
    pointer-events: none;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, transform 0.2s ease;
    z-index: 10;

    &::after {
      content: "";
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: #333;
    }
  }

  &__toggle-profile-visibility {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__chevron-icon {
    display: flex;
    flex-direction: column;
    align-items: center;

    i {
      cursor: pointer;
      font-size: 28px;
    }
  }

  &__loaded {
    animation: profile-card-fade-in 0.3s ease;
  }

  &__skeleton {
    display: block;
    min-height: 420px;

    @media (max-width: #{$breakpoint-md - 1px}) {
      min-height: 0;
    }
  }

  &__skeleton-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    margin-top: 24px;
  }

  &__image--skeleton {
    background-color: transparent;
    padding: 0;
  }

  &__skeleton-avatar {
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
        #f0f0f0 25%,
        #e0e0e0 50%,
        #f0f0f0 75%
      );
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 10px;
  }

  &__skeleton-name {
    height: 20px;
    width: 150px;
    background: linear-gradient(
      90deg,
        #f0f0f0 25%,
        #e0e0e0 50%,
        #f0f0f0 75%
      );
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 4px;
    margin-bottom: 16px;

    @include md {
      height: 24px;
    }
  }

  &__skeleton-location {
    height: 14px;
    width: 120px;
    background: linear-gradient(
      90deg,
        #f0f0f0 25%,
        #e0e0e0 50%,
        #f0f0f0 75%
      );
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 4px;
    margin-bottom: 16px;
  }

  &__skeleton-block {
    height: 16px;
    border-radius: 4px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;

    &--label {
      width: 100px;
      height: 14px;
    }

    &--value {
      width: 160px;
      height: 14px;
      margin-top: -16px;
    }
  }

  &__skeleton-icons {
    display: flex;
    justify-content: center;
    margin-top: -8px;
  }

  &__skeleton-icon {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }

  &__skeleton-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
    margin-top: -8px;
  }

  &__skeleton-tag {
    width: 180px;
    height: 28px;
    border-radius: 6px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;

    &--short {
      width: 140px;
    }
  }

  &__skeleton-button {
    width: 100%;
    max-width: 220px;
    height: 32px;
    border-radius: 6px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    margin-top: 8px;
  }
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@keyframes profile-card-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>