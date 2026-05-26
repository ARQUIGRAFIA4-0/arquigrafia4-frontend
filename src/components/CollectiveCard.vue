<script setup>
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useInitialSkeleton } from "@/composables/useInitialSkeleton";
import { useSubjectTerms } from "@/composables/useSubjectTerms";
import { useCollectivesStore } from "@/store/collectives";
import profileImageDefault from "@/assets/collective_image.png";

const props = defineProps({
  collectiveData: { type: Object, default: null },
  /** null = visitante/não membro | "member" | "admin" */
  userRole: { type: String, default: null },
  isLoggedIn: { type: Boolean, default: false },
  isMobile: { type: Boolean, default: false },
});

const router = useRouter();
const collectivesStore = useCollectivesStore();
const { hasLoaded, finishInitialLoad } = useInitialSkeleton();
const { loadAllSubjects, getTermById } = useSubjectTerms();

const loadStartedAt = ref(Date.now());
const showFullProfile = ref(false);
const joinRequested = ref(false);
const joinError = ref("");
const inviteCopied = ref(false);
const actionError = ref("");
const leaveLoading = ref(false);

const showSkeleton = computed(() => !hasLoaded.value);

const hasSocials = computed(() => {
  const s = props.collectiveData?.socials;
  return Array.isArray(s) && s.length > 0;
});

watch(
  () => props.collectiveData,
  async (data) => {
    if (!data) return;
    await loadAllSubjects();
    await finishInitialLoad(loadStartedAt.value);
  },
  { immediate: true }
);

watch(
  () => props.isMobile,
  (isMobile) => {
    if (!isMobile) showFullProfile.value = true;
  },
  { immediate: true }
);

function getSocialLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

async function handleJoinRequest() {
  if (joinRequested.value) return;
  joinError.value = "";
  const result = await collectivesStore.requestJoin(props.collectiveData.id);
  if (result.success || result.alreadyRequested) {
    joinRequested.value = true;
    if (result.alreadyRequested) {
      joinError.value = result.message;
    }
  } else {
    joinError.value = result.message;
  }
}

async function handleCopyInvite() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    inviteCopied.value = true;
    setTimeout(() => (inviteCopied.value = false), 4000);
  } catch {
    actionError.value = "Não foi possível copiar o link. Copie manualmente a URL da página.";
  }
}

async function handleLeave() {
  if (!confirm("Tem certeza que deseja deixar de participar deste coletivo?")) return;
  actionError.value = "";
  leaveLoading.value = true;
  const result = await collectivesStore.leaveCollective(props.collectiveData.id);
  leaveLoading.value = false;
  if (result.success) {
    router.push("/coletivos");
  } else {
    actionError.value = result.message;
  }
}
</script>

<template>
  <div class="collective-card">
    <!-- Skeleton -->
    <div
      v-if="showSkeleton"
      class="collective-card__skeleton"
      aria-busy="true"
      aria-label="Carregando coletivo"
    >
      <div class="collective-card__header">
        <div class="collective-card__skeleton-avatar"></div>
        <div class="collective-card__skeleton-name"></div>
        <div class="collective-card__skeleton-location"></div>
      </div>
      <div v-if="!isMobile" class="collective-card__skeleton-content">
        <div class="collective-card__skeleton-block collective-card__skeleton-block--label"></div>
        <div class="collective-card__skeleton-block collective-card__skeleton-block--value"></div>
        <div class="collective-card__skeleton-block collective-card__skeleton-block--label"></div>
        <div class="collective-card__skeleton-tags">
          <div class="collective-card__skeleton-tag"></div>
          <div class="collective-card__skeleton-tag collective-card__skeleton-tag--short"></div>
        </div>
        <div class="collective-card__skeleton-button"></div>
      </div>
    </div>

    <!-- Conteúdo carregado -->
    <div v-else class="collective-card__loaded">
      <div class="collective-card__header">
        <div class="collective-card__image">
          <img
            :src="collectiveData?.avatar_url || profileImageDefault"
            alt="Foto do coletivo"
          />
        </div>
        <h2>{{ collectiveData?.name }}</h2>
        <div v-if="collectiveData?.location" class="collective-card__location">
          <i class="bi bi-geo-alt"></i>
          <p>{{ collectiveData.location }}</p>
        </div>
      </div>

      <div v-if="showFullProfile" class="collective-card__content">
        <div v-if="collectiveData?.description" class="collective-card__section">
          <h3>Descrição do coletivo</h3>
          <p>{{ collectiveData.description }}</p>
        </div>

        <div v-if="collectiveData?.subjects?.length" class="collective-card__section">
          <h3>Temas abordados</h3>
          <ul class="collective-card__tags">
            <li
              v-for="subjectId in collectiveData.subjects"
              :key="subjectId"
              class="btn btn-outline-secondary btn-sm btn-tag d-inline-flex align-items-center"
            >
              {{ getTermById(subjectId) }}
            </li>
          </ul>
        </div>

        <div v-if="hasSocials" class="collective-card__section">
          <h3>Redes</h3>
          <ul class="collective-card__socials">
            <li v-for="url in collectiveData.socials" :key="url">
              <a :href="url" target="_blank" rel="noopener noreferrer">
                {{ getSocialLabel(url) }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Ações condicionais -->
        <div class="collective-card__actions">
          <!-- Feedbacks globais -->
          <div v-if="inviteCopied" class="alert alert-success py-1 px-2 small" role="alert">
            Link copiado! Compartilhe com quem quiser convidar.
          </div>
          <div v-if="actionError" class="alert alert-danger py-1 px-2 small" role="alert">
            {{ actionError }}
          </div>

          <!-- Usuário logado, não membro -->
          <template v-if="isLoggedIn && userRole === null">
            <div v-if="joinError" class="alert alert-warning py-1 px-2 small" role="alert">
              {{ joinError }}
            </div>
            <button
              class="btn btn-primary btn-sm w-100"
              :disabled="joinRequested"
              @click="handleJoinRequest"
            >
              {{ joinRequested ? "Solicitação enviada" : "Fazer parte" }}
            </button>
          </template>

          <!-- Membro ou admin -->
          <template v-if="userRole === 'member' || userRole === 'admin'">
            <button class="btn btn-primary btn-sm w-100" @click="handleCopyInvite">
              Convidar participantes
            </button>
          </template>

          <!-- Admin -->
          <template v-if="userRole === 'admin'">
            <button class="btn btn-outline-secondary btn-sm w-100" disabled>
              Editar perfil
            </button>
          </template>

          <!-- Membro ou admin: deixar de participar -->
          <template v-if="userRole === 'member' || userRole === 'admin'">
            <button
              class="btn btn-sm w-100 collective-card__leave-btn"
              :disabled="leaveLoading"
              @click="handleLeave"
            >
              {{ leaveLoading ? "Saindo..." : "Deixar de participar" }}
            </button>
          </template>
        </div>
      </div>

      <!-- Chevron mobile -->
      <div v-if="isMobile" class="collective-card__chevron-icon">
        <i
          :class="[
            showFullProfile ? 'bi bi-chevron-compact-up' : 'bi bi-chevron-compact-down',
            'chevron-icon',
          ]"
          @click="showFullProfile = !showFullProfile"
          aria-label="Mostrar mais"
        ></i>
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

.collective-card {
  background-color: $color-off-white;
  border-radius: 16px;
  padding: 24px 16px;
  box-shadow: 1px 1px 4px 1px #0000001a;
  margin-bottom: 40px;

  @include md {
    padding: 24px;
    margin-bottom: 0;
  }

  &__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    @include md {
      margin-bottom: 16px;
    }

    h2 {
      font-family: "DM Sans", sans-serif;
      font-weight: 500;
      font-size: 16px;
      line-height: 150%;
      text-align: center;
      margin: 0;

      @include md {
        font-size: 20px;
      }
    }
  }

  &__image {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    overflow: hidden;
    background-color: $color-laranja-e;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    }
  }

  &__location {
    display: flex;
    align-items: center;
    gap: 4px;
    color: $color-cinza-m;

    i {
      font-size: 10px;
    }

    p {
      margin: 0;
      font-size: 12px;
      line-height: 1.15;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 8px;

    h3 {
      font-family: "DM Sans", sans-serif;
      font-weight: 700;
      font-size: 16px;
      line-height: 150%;
      color: $color-cinza-m;
      text-align: center;
      margin: 0;
    }

    p {
      font-size: 14px;
      line-height: 1.25;
      color: $color-cinza-m;
      margin: 0;
    }
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      font-size: 12px;
      border-radius: 2px;
    }
  }

  &__socials {
    display: flex;
    flex-direction: column;
    gap: 4px;
    list-style: none;
    padding: 0;
    margin: 0;
    align-items: center;

    li a {
      font-size: 13px;
      color: $color-azul-e;
      word-break: break-all;
    }
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 4px;
  }

  &__leave-btn {
    background: none;
    border: none;
    color: $color-cinza-e;
    text-decoration: underline;
    padding-left: 0;
    padding-right: 0;

    &:hover:not(:disabled) {
      color: $color-negativo-e;
      background: none;
    }

    &:disabled {
      opacity: 0.6;
    }
  }

  &__chevron-icon {
    display: flex;
    justify-content: center;
    margin-top: 12px;
    cursor: pointer;

    .chevron-icon {
      font-size: 20px;
      color: $color-cinza-m;
    }
  }

  // Skeleton styles
  &__skeleton {
    animation: skeleton-pulse 1.5s ease-in-out infinite;
  }

  &__skeleton-avatar {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background-color: $color-cinza-c;
    margin: 0 auto 8px;
  }

  &__skeleton-name {
    height: 20px;
    width: 120px;
    background-color: $color-cinza-c;
    border-radius: 4px;
    margin: 0 auto 8px;
  }

  &__skeleton-location {
    height: 12px;
    width: 80px;
    background-color: $color-cinza-c;
    border-radius: 4px;
    margin: 0 auto;
  }

  &__skeleton-content {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__skeleton-block {
    background-color: $color-cinza-c;
    border-radius: 4px;

    &--label {
      height: 16px;
      width: 100px;
      margin: 0 auto;
    }

    &--value {
      height: 40px;
      width: 100%;
    }
  }

  &__skeleton-tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }

  &__skeleton-tag {
    height: 22px;
    width: 80px;
    background-color: $color-cinza-c;
    border-radius: 2px;

    &--short {
      width: 60px;
    }
  }

  &__skeleton-button {
    height: 34px;
    background-color: $color-cinza-c;
    border-radius: 5px;
    margin-top: 8px;
  }
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
