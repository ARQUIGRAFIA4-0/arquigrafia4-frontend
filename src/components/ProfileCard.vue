<script setup>
import { ref, computed, watch } from "vue";
import profileImageDefault from '@/assets/profile_image.png';

const props = defineProps({
  userData: { type: Object, default: null },
  profileData: { type: Object, default: null },
  isMobile: { type: Boolean, default: false },
  isOwnProfile: { type: Boolean, default: false }
});

const API_BASE_URL = import.meta.env.VITE_BASE_REQUEST_URL;

const showFullProfile = ref(false);

const isLoading = computed(() => {
  return !props.userData || !props.profileData;
});

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
    <!-- Exibe skeleton durante carregamento de dados -->
    <div v-if="isLoading" class="profile-card__skeleton">
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
    </div>

    <!-- Exibe conteúdo real quando dados carregados -->
    <template v-else>
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
            <li v-for="(subject, index) in currentProfileData.subjects" :key="subject.id"
              class="btn btn-outline-secondary btn-sm btn-tag d-inline-flex align-items-center">
              {{ subject.term }}
            </li>
          </ul>
        </div>
        <div v-if="props.isOwnProfile" class="profile-card__toggle-profile-visibility">
          <a :href="`/profile/${userData?.id}`" target="_blank" class="btn btn-secondary btn-sm btn-icon">
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
    </template>
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

    .btn {
      cursor: default;
      white-space: normal;
      word-break: break-all;
      text-align: center;
      max-width: 100%;
    }

    li {
      @include md {
        font-size: 12px;
      }
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

  &__skeleton {
    display: block;
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
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>