<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import { useCollectivesStore } from "@/store/collectives";
import { storeToRefs } from "pinia";

const router = useRouter();
const authStore = useAuthStore();
const collectivesStore = useCollectivesStore();
const { isLoading } = storeToRefs(collectivesStore);

const DESCRIPTION_MAX_LENGTH = 500;
const NAME_MAX_LENGTH = 255;

const name = ref("");
const description = ref("");

const alertMessage = ref("");
const alertType = ref("");
const showAlert = ref(false);

const descriptionLength = computed(() => description.value.length);
const isDescriptionOverLimit = computed(() => descriptionLength.value > DESCRIPTION_MAX_LENGTH);
const isNameOverLimit = computed(() => name.value.trim().length > NAME_MAX_LENGTH);

const canSubmit = computed(
  () => name.value.trim().length > 0 && !isDescriptionOverLimit.value && !isNameOverLimit.value && !isLoading.value
);

function displayAlert(message, type = "error") {
  alertMessage.value = message;
  alertType.value = type;
  showAlert.value = true;
}

function closeAlert() {
  showAlert.value = false;
  alertMessage.value = "";
  alertType.value = "";
}

async function handleSubmit() {
  if (!authStore.isLoggedIn) {
    router.push("/login");
    return;
  }

  closeAlert();

  const result = await collectivesStore.createCollective({
    name: name.value,
    description: description.value,
  });

  if (result.success) {
    router.push("/eu");
  } else {
    displayAlert(result.message, "error");
  }
}

onMounted(() => {
  if (!authStore.isLoggedIn) {
    router.push("/login");
  }
  closeAlert();
});
</script>

<template>
  <div class="login-container">
    <!-- Loading overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
      <p class="mt-3 text-primary">Criando coletivo...</p>
    </div>

    <h2 class="form-title text-start mb-4">Crie o perfil de seu coletivo</h2>

    <!-- Feedback alert -->
    <div
      v-if="showAlert"
      :class="[
        'alert',
        'fs-6',
        alertType === 'success' ? 'bg-positivo-e' : 'bg-negativo-e',
        'text-white',
        'mb-3',
        'd-flex',
        'align-items-center',
        'justify-content-between',
        'auth-alert',
      ]"
      role="alert"
    >
      <div class="d-flex align-items-center gap-2">
        <i :class="alertType === 'success' ? 'bi bi-check-all' : 'bi bi-exclamation-triangle-fill'"></i>
        <span>{{ alertMessage }}</span>
      </div>
      <button
        type="button"
        class="btn-close text-white"
        @click="closeAlert"
        aria-label="Fechar"
      ></button>
    </div>

    <form @submit.prevent="handleSubmit">
      <!-- Name field -->
      <div class="mb-3">
        <label for="collective-name" class="input-label mb-1">
          Qual o nome de seu coletivo?
        </label>
        <input
          id="collective-name"
          v-model="name"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': isNameOverLimit }"
          placeholder="Nome do coletivo"
          autocomplete="off"
          maxlength="255"
        />
        <small class="form-text d-block mt-1 form-input-subtitle text-end">
          Preenchimento obrigatório.
        </small>
      </div>

      <!-- Description field -->
      <div class="mb-3">
        <label for="collective-description" class="input-label mb-1">
          Descrição do coletivo
        </label>
        <textarea
          id="collective-description"
          v-model="description"
          class="form-control"
          placeholder="Breve descrição do coletivo, seus objetivos e atividades."
          rows="4"
          maxlength="500"
        ></textarea>
        <small
          class="form-text d-block mt-1 form-input-subtitle text-end"
          :class="{ 'text-danger': isDescriptionOverLimit }"
        >
          {{ descriptionLength }}/{{ DESCRIPTION_MAX_LENGTH }} — Máx de {{ DESCRIPTION_MAX_LENGTH }} caracteres.
        </small>
      </div>

      <!-- Warning notice -->
      <div
        class="alert alert-dark bg-off-white alert-light border border-dark border-start-3 mb-4 collective-warning-alert"
        role="alert"
      >
        <i class="bi bi-exclamation-triangle me-2"></i>
        Recomendamos que apenas adicione grupos dos quais você de fato participa.
      </div>

      <!-- Submit button -->
      <div class="d-grid">
        <button
          type="submit"
          class="btn btn-primary btn-sm"
          :disabled="!canSubmit"
        >
          Criar perfil
        </button>
      </div>
    </form>
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

.login-container {
  background-color: #faf9f9;
  border-radius: 16px;
  padding: 2rem;
  font-weight: 500;
  position: sticky;
  top: 32px;
  z-index: 100;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(250, 249, 249, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  z-index: 10;
}

.form-title {
  font-weight: 500;
  font-size: 20px;
  line-height: 150%;

  @include md {
    font-size: 30px;
  }
}

.input-label {
  font-weight: 500;
  font-size: 16px;
  line-height: 120%;
  display: block;
  padding-bottom: 10px;

  @include md {
    font-size: 20px;
  }
}

.form-input-subtitle {
  padding-left: 4px;
  padding-right: 4px;
  color: var(--Cinza_M);
  font-weight: 400;
  font-style: italic;
  font-size: 12px;
  line-height: 125%;
}

.auth-alert {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1050;
  width: auto;
  max-width: 90%;
}

.collective-warning-alert {
  width: auto;
  max-width: 100%;
  height: auto;
  font-weight: 400;
  font-size: 14px;
  line-height: 150%;
  letter-spacing: 0%;
}
</style>
