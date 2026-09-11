<script setup>
import { computed, ref, watchEffect } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import UploadImageBox from "@/components/UploadImageBox.vue";
import CollaborationGuidelines from "@/components/CollaborationGuidelines.vue";
import UploadInstructionsModal from "@/components/UploadInstructionsModal.vue";

defineOptions({ name: "CollaborateView" });

const router = useRouter();
const store = useAuthStore();
const isLoggedIn = computed(() => store.isLoggedIn);

// Redireciona para /login se o usuário não estiver logado
watchEffect(() => {
  if (!isLoggedIn.value) {
    router.push("/login");
  }
});

// No mobile/tablet as orientações ficam num modal, aberto pelo botão
// "Como funciona?". No desktop (>= lg) elas ficam sempre visíveis na
// coluna ao lado, então o botão nem é renderizado (ver CSS).
const uploadBoxRef = ref(null);
const showInstructionsModal = ref(false);

function openInstructionsModal() {
  showInstructionsModal.value = true;
}

function handleInstructionsConfirm() {
  uploadBoxRef.value?.openFileDialog();
}
</script>

<template>
  <div v-if="isLoggedIn">
    <!-- Usuário logado -->
    <div class="collaborate-layout">
      <div class="collaborate-layout__main">
        <button
          type="button"
          class="collaborate-layout__help-btn"
          @click="openInstructionsModal"
        >
          <i class="bi bi-question-circle" aria-hidden="true"></i>
          Como funciona?
        </button>

        <UploadImageBox
          ref="uploadBoxRef"
          :show-upload-instructions="true"
          instructions-title="Colabore com o ARQUIGRAFIA<br />enviando suas imagens."
        />
      </div>

      <aside class="collaborate-layout__guidelines">
        <CollaborationGuidelines />
      </aside>
    </div>

    <!-- Só é acionado no mobile/tablet, pelo botão "Como funciona?" acima -->
    <UploadInstructionsModal
      v-model="showInstructionsModal"
      @confirm="handleInstructionsConfirm"
    />
  </div>
</template>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

@mixin lg {
  @media (min-width: #{$breakpoint-lg}) {
    @content;
  }
}

.collaborate-layout {
  padding: 1.5rem 1rem;

  @include md {
    padding-left: 50px;
    padding-right: 50px;
  }

  // Abaixo de lg: uma coluna só (botão + caixa de upload), orientações
  // ficam escondidas — quem mostra o conteúdo é o modal.
  // A partir de lg: duas colunas lado a lado, sempre visíveis.
  @include lg {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
    gap: 20px;
    align-items: start;
  }

  &__help-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
    padding: 0;
    border: none;
    background: none;
    color: #0f59a5;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;

    i {
      font-size: 16px;
    }

    @include lg {
      display: none;
    }
  }

  &__guidelines {
    display: none;

    @include lg {
      display: block;
    }
  }
}
</style>