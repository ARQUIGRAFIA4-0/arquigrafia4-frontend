<script setup>
  import { ref, computed, watch, onUnmounted } from "vue";
  import { useAuthStore } from "@/store/auth";
  import { useAlbumsStore } from "@/store/albums";

  const authStore = useAuthStore();
  const albumsStore = useAlbumsStore();
  const userAuthHeader = computed(() => authStore.authHeader);

  // Campos de criação de coleção
  const collectionTitle = ref("");
  const collectionDescription = ref("");
  const collectionIsPrivate = ref(false);
  const isSubmittingCollection = ref(false);

  // Toast de criação de coleção
  const showCollectionToast = ref(false);
  const collectionToastMessage = ref("");
  const collectionToastType = ref("success");
  const createdCollectionName = ref("");
  let collectionToastTimeout = null;

  // Função para abrir o toast de criação de coleção
  function openCollectionToast(message, type = "success", collectionName = "") {
    collectionToastMessage.value = message;
    collectionToastType.value = type;
    createdCollectionName.value = collectionName;
    showCollectionToast.value = true;

    if (collectionToastTimeout) {
      clearTimeout(collectionToastTimeout);
    }

    collectionToastTimeout = setTimeout(() => {
      showCollectionToast.value = false;
      collectionToastTimeout = null;
    }, 2200);
  }

  // Props
  const props = defineProps({
      modelValue: { type: Boolean, default: false },
      userData: { type: Object, default: null },
      // Quando informado, a coleção é criada para o coletivo (collective_id no payload)
      // em vez de para o usuário autenticado.
      collectiveId: { type: [String, Number], default: null },
  });

  const emit = defineEmits(["update:modelValue", "created"]);

  // Fechar modal de criação de coleção
  function close() {
    emit("update:modelValue", false);
  }

  // Prosseguir com a criação da coleção
  async function handleProceedWithCollection() {
    if (isSubmittingCollection.value) return;
    
    // Para coleção de coletivo basta o collectiveId; para coleção de usuário
    // é necessário o usuário autenticado.
    if (!props.collectiveId) {
      const userId = props.userData?.id ?? null;
      if (!userId) {
        openCollectionToast("Usuário não identificado.", "error");
        return;
      }
    }

    // Validar se o título está preenchido
    const title = collectionTitle.value.trim();
    const description = collectionDescription.value.trim();
    if (!title) {
      openCollectionToast("Preencha o título.", "error");
      return;
    }

    // Criar o payload para o envio ao backend
    const payload = { title, description, is_private: collectionIsPrivate.value };
    if (props.collectiveId) {
      payload.collective_id = props.collectiveId;
    }

    try {
      isSubmittingCollection.value = true;
      // envio efetivo ao backend
      const createdAlbum = await albumsStore.createAlbum(userAuthHeader.value, payload);
      close();
      // Emitir evento de criação de coleção
      emit("created", createdAlbum);
      openCollectionToast("", "success", createdAlbum?.title || title);

    } catch (error) {
      openCollectionToast(error.message || "Erro ao criar coleção.", "error");

    } finally {
      isSubmittingCollection.value = false;

    }

  }

  onUnmounted(() => {
    if (collectionToastTimeout) {
      clearTimeout(collectionToastTimeout);
    }
  });

  // Resetar campos quando o modal abrir
  watch(
      () => props.modelValue,
      (open) => {
          if (open) {
              collectionTitle.value = "";
              collectionDescription.value = "";
              collectionIsPrivate.value = false;
          }
      }
  );    

</script>

<template>

    <transition name="fade-modal">
        <div
            v-if="modelValue"
            class="collection-modal__backdrop"
            @click.self="close"
        >
            <div class="collection-modal__panel" role="dialog" aria-modal="true" aria-labelledby="collection-modal-title">
            <div class="collection-modal__column">
                <div class="collection-modal__close-row">
                  <button
                    type="button"
                    class="collection-modal__close-btn"
                    aria-label="Fechar modal de criar coleção"
                    @click="close"
                  >
                    <i class="bi bi-x-circle-fill" aria-hidden="true"></i>
                  </button>
                </div>
                <div class="collection-modal__header">
                <p id="collection-modal-title" class="collection-modal__title">Criar coleção</p>
                </div>

                <div class="collection-modal__body">
                <div class="collection-modal__field">
                    <div class="collection-modal__label-row">
                      <label class="collection-modal__label" for="collection-title">Título</label>
                      <span class="collection-modal__label-help" aria-hidden="true">
                        <i class="bi bi-question-circle-fill"></i>
                      </span>
                    </div>
                    <input
                    id="collection-title"
                    v-model="collectionTitle"
                    class="collection-modal__input"
                    type="text"
                    placeholder="Crie um título para sua coleção"
                    />
                    <p class="collection-modal__hint">Preenchimento obrigatório.</p>
                </div>

                <div class="collection-modal__field">
                    <div class="collection-modal__label-row">
                      <label class="collection-modal__label" for="collection-description">Descrição</label>
                      <span class="collection-modal__label-help" aria-hidden="true">
                        <i class="bi bi-question-circle-fill"></i>
                      </span>
                    </div>
                    <textarea
                    id="collection-description"
                    v-model="collectionDescription"
                    class="collection-modal__textarea"
                    rows="6"
                    placeholder="Descreva a nova coleção"
                    />
                </div>

                <div class="collection-modal__field">
                    <div class="collection-modal__label-row">
                      <label class="collection-modal__label" for="collection-visibility">Visibilidade</label>
                      <span class="collection-modal__label-help" aria-hidden="true">
                        <i class="bi bi-question-circle-fill"></i>
                      </span>
                    </div>
                    <select
                    id="collection-visibility"
                    v-model="collectionIsPrivate"
                    class="collection-modal__select"
                    >
                      <option :value="false">Pública</option>
                      <option :value="true">Privada</option>
                    </select>
                    <p class="collection-modal__hint collection-modal__hint--left">
                      Coleções privadas só podem ser vistas por você ou pelos membros do coletivo.
                    </p>
                </div>
                </div>
            </div>

            <div class="collection-modal__footer">
                <button type="button" class="collection-modal__btn collection-modal__btn--secondary" @click="close">
                Cancelar
                </button>
                <button
                type="button"
                class="collection-modal__btn collection-modal__btn--primary"
                :disabled="!collectionTitle.trim() || isSubmittingCollection"
                @click="handleProceedWithCollection"
                >
                {{ isSubmittingCollection ? "Criando..." : "Prosseguir" }}
                </button>
            </div>
            </div>
        </div>
    </transition>    

    <transition name="copy-toast-fade">
      <div
        v-if="showCollectionToast"
        class="collection-modal__toast"
        :class="{
          'collection-modal__toast--error': collectionToastType === 'error',
        }"
        role="status"
        aria-live="polite"
      >
        <i
          class="bi"
          :class="collectionToastType === 'error' ? 'bi-exclamation-circle' : 'bi-check-all'"
          aria-hidden="true"
        />
        <span v-if="collectionToastType === 'success'" class="collection-modal__toast-text">
          Você criou a Coleção
          <span class="collection-modal__toast-collection-name">
            {{ createdCollectionName || collectionTitle.trim() }}
          </span>
        </span>
        <span v-else class="collection-modal__toast-text">{{ collectionToastMessage }}</span>
      </div>
    </transition>

</template>

<style lang="scss" scoped>

// Modal de criação de coleção
.fade-modal-enter-active {
  transition: opacity 0.2s ease;
}

.fade-modal-enter-active .collection-modal__panel {
  transition: opacity 0.3s ease 0.2s;
}

.fade-modal-leave-active {
  transition: opacity 0.2s ease 0.2s;
}

.fade-modal-leave-active .collection-modal__panel {
  transition: opacity 0.2s ease;
}

.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
}

.fade-modal-enter-from .collection-modal__panel,
.fade-modal-leave-to .collection-modal__panel {
  opacity: 0;
}

.collection-modal__toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1300;
  display: inline-flex;
  align-items: center;
  gap: 16px;
  width: auto;
  max-width: calc(100vw - 24px);
  box-sizing: border-box;
  padding: 12px 12px 12px 16px;
  border-radius: 4px;
  background: #356407;
  color: var(--branco, #fff);
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  white-space: nowrap;
}

.collection-modal__toast .bi {
  font-size: 16px;
  line-height: 1;
}

.collection-modal__toast-text {
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
}

.collection-modal__toast-collection-name {
  font-style: italic;
}

.collection-modal__toast--error {
  background: #7a1c1c;
}

.copy-toast-fade-enter-active,
.copy-toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.copy-toast-fade-enter-from,
.copy-toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px);
}

.collection-modal__backdrop {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  padding: 16px;
  box-sizing: border-box;
}

.collection-modal__panel {
  display: flex;
  width: 600px;
  max-width: calc(100dvh - 32px);
  box-sizing: border-box;
  padding: 0 16px;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  overflow: hidden;
  border-radius: 16px;
  background: var(--off_white, #faf9f9);
  box-shadow: 4px 4px 8px 0 rgba(0, 0, 0, 0.1);
}

.collection-modal__column {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0 32px;
  box-sizing: border-box;
}

.collection-modal__close-row {
  width: 100%;
  display: none;
  justify-content: flex-end;
  padding-top: 20px;
}

.collection-modal__close-btn {
  width: 24px;
  height: 24px;
  display: none;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #2f2f2f;
  padding: 0;
  cursor: pointer;
}

.collection-modal__close-btn .bi {
  font-size: 24px;
  line-height: 1;
}

.collection-modal__header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 32px;
  padding-bottom: 8px;
}

.collection-modal__title {
  flex: 1 0 0;
  margin: 0;
  font-family: "DM Sans", sans-serif;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.5;
  color: #2f2f2f;
}

.collection-modal__body {
  width: 100%;
  padding: 0 12px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.collection-modal__field {
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 100%;
}

.collection-modal__label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.collection-modal__label {
  display: flex;
  align-items: center;
  width: auto;
  padding: 8px 0;
  margin: 0;
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  color: #212529;
}

.collection-modal__label-help {
  display: inline-flex;
  width: 12px;
  height: 12px;
  align-items: center;
  justify-content: center;
  color: #212529;
}

.collection-modal__label-help .bi {
  font-size: 10px;
  line-height: 1;
}

.collection-modal__input,
.collection-modal__textarea {
  width: 100%;
  border: 0.75px solid var(--preto, #1f1f1f);
  border-radius: 5px;
  background: var(--off_white, #faf9f9);
  box-sizing: border-box;
  padding: 6px 10px;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #212529;
}

.collection-modal__input {
  height: 30px;
}

.collection-modal__select {
  width: 100%;
  height: 30px;
  border: 0.75px solid var(--preto, #1f1f1f);
  border-radius: 5px;
  background: var(--off_white, #faf9f9);
  box-sizing: border-box;
  padding: 6px 10px;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #212529;
  cursor: pointer;
}

.collection-modal__select:focus {
  outline: none;
}

.collection-modal__textarea {
  min-height: 120px;
  resize: vertical;
}

.collection-modal__input::placeholder,
.collection-modal__textarea::placeholder {
  color: #636262;
  font-style: italic;
}

.collection-modal__input:focus,
.collection-modal__textarea:focus {
  outline: none;
}

.collection-modal__hint {
  margin: 0;
  padding: 4px 0;
  width: 100%;
  text-align: right;
  font-family: "DM Sans", sans-serif;
  font-size: 10px;
  font-weight: 400;
  line-height: 16px;
  color: #2f2f2f;
}

.collection-modal__hint--left {
  text-align: left;
}

.collection-modal__footer {
  width: 100%;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  align-self: stretch;
  padding: 16px 0;
  box-sizing: border-box;
}

.collection-modal__btn {
  flex: 1 0 0;
  min-width: 0;
  margin: 0;
  padding: 2px 14px;
  border-radius: 5px;
  border-style: solid;
  border-width: 1px;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  text-align: center;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  box-sizing: border-box;
}

.collection-modal__btn--secondary {
  background: var(--off_white, #faf9f9);
  border-color: var(--cinza_e, #2f2f2f);
  color: var(--cinza_e, #2f2f2f);
}

.collection-modal__btn--primary {
  background: var(--cinza_e, #2f2f2f);
  border-color: var(--cinza_e, #2f2f2f);
  color: var(--branco, #ffffff);
}

.collection-modal__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* regras mobile - padrão ReportModal */
@media (max-width: 767px) {
  .collection-modal__backdrop {
    padding: 0;
    align-items: stretch;
    justify-content: stretch;
    background: rgba(0, 0, 0, 0.1);
  }

  .collection-modal__panel {
    width: 100vw;
    max-width: 100vw;
    height: 100dvh;
    margin: 0;
    border-radius: 0;
    padding: 0;
    gap: 0;
    display: grid;
    grid-template-rows: auto 1fr auto;
    overflow: hidden;
  }

  .collection-modal__column {
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 0 32px;
  }

  .collection-modal__close-row {
    display: flex;
    padding-top: 20px;
  }

  .collection-modal__close-btn {
    display: inline-flex;
  }

  .collection-modal__header {
    padding-top: 4px;
    padding-bottom: 12px;
  }

  .collection-modal__title {
    margin: 0;
    font-size: 16px;
    line-height: 1.5;
  }

  .collection-modal__body {
    flex: 1 1 auto;
    min-height: 0;
    padding: 0 0 24px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    gap: 16px;
  }

  .collection-modal__label {
    font-size: 14px;
    padding: 4px 0;
  }

  .collection-modal__input {
    height: 26px;
    padding: 4px 8px;
    font-size: 12px;
  }

  .collection-modal__select {
    height: 26px;
    padding: 2px 8px;
    font-size: 12px;
  }

  /* Campo de descrição: área de texto confortável no touch (evita height 26px de uma linha) */
  .collection-modal__textarea {
    min-height: 200px;
    height: auto;
    padding: 10px 12px;
    font-size: 14px;
    line-height: 1.5;
    resize: vertical;
  }

  .collection-modal__input::placeholder,
  .collection-modal__textarea::placeholder {
    font-size: 12px;
    line-height: 1.5;
  }

  .collection-modal__hint {
    font-size: 10px;
    line-height: 16px;
    padding-top: 4px;
  }

  .collection-modal__footer {
    grid-row: 3;
    display: flex;
    flex-direction: row;
    gap: 16px;
    padding: 8px 8px calc(32px + env(safe-area-inset-bottom));
    align-self: stretch;
    box-sizing: border-box;
    background: var(--off_white, #faf9f9);
    padding-inline: 16px;
  }

  .collection-modal__btn {
    width: auto;
    flex: 1 0 0;
    min-height: 30px;
    height: 30px;
    padding: 2px 14px;
    line-height: 1.5;
  }

  .collection-modal__btn--secondary { order: 1; }
  .collection-modal__btn--primary { order: 2; }

  .collection-modal__toast {
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100vw - 24px);
    max-width: 350px;
    gap: 10px;
    padding: 10px 12px;
    font-size: 13px;
    box-sizing: border-box;
  }
}
</style>