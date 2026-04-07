<script setup>
    import { ref } from "vue";

    const showCreateCollectionModal = ref(false);

    const collectionTitle = ref("");
    const collectionDescription = ref("");

    // Props
    const props = defineProps({
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
    });

    // Abrir modal de criação de coleção
    function openCreateCollectionModal() {
        collectionTitle.value = "";
        collectionDescription.value = "";
        showCreateCollectionModal.value = true;
    }

    // Fechar modal de criação de coleção
    function closeCreateCollectionModal() {
        showCreateCollectionModal.value = false;
    }

    // Prosseguir com a criação da coleção
    function handleProceedWithCollection() {
        // Extrair o ID do usuário a partir da prop userData
        const userId = props.userData?.id ?? null;

        // Criar payload para criação da coleção
        const payload = {
            title: collectionTitle.value,
            description: collectionDescription.value
        };
        
        // Log payload e userId
        console.log(payload);
        console.log(userId);

        // Fechar modal de criação de coleção
        closeCreateCollectionModal();
    }

</script>

<template>

    <!-- Caixa de upload inicial -->
    <section class="upload-collection-box" @click="openCreateCollectionModal">
        <div class="upload-collection-box__content">
            <h2 class="upload-collection-box__title" v-html="instructionsTitle"></h2>
            <i class="bi bi-plus-circle-fill upload-collection-box__icon"></i>
            <p class="upload-collection-box__subtitle">clique aqui para criar uma</p>
        </div>
    </section>

    <transition name="fade-modal">
        <div
            v-if="showCreateCollectionModal"
            class="collection-modal__backdrop"
            @click.self="closeCreateCollectionModal"
        >
            <div class="collection-modal__panel" role="dialog" aria-modal="true" aria-labelledby="collection-modal-title">
            <div class="collection-modal__column">
                <div class="collection-modal__header">
                <p id="collection-modal-title" class="collection-modal__title">Criar coleção</p>
                </div>

                <div class="collection-modal__body">
                <div class="collection-modal__field">
                    <label class="collection-modal__label" for="collection-title">Título</label>
                    <input
                    id="collection-title"
                    v-model="collectionTitle"
                    class="collection-modal__input"
                    type="text"
                    placeholder="Crie um título para sua coleção"
                    />
                </div>

                <div class="collection-modal__field">
                    <label class="collection-modal__label" for="collection-description">Descrição</label>
                    <textarea
                    id="collection-description"
                    v-model="collectionDescription"
                    class="collection-modal__textarea"
                    rows="5"
                    placeholder="Descreva a nova coleção"
                    />
                </div>
                </div>
            </div>

            <div class="collection-modal__footer">
                <button type="button" class="collection-modal__btn collection-modal__btn--secondary" @click="closeCreateCollectionModal">
                Voltar
                </button>
                <button
                type="button"
                class="collection-modal__btn collection-modal__btn--primary"
                :disabled="!collectionTitle.trim() || !collectionDescription.trim()"
                @click="handleProceedWithCollection"
                >
                Prosseguir
                </button>
            </div>
            </div>
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

@media (max-width: 767px) {
  .upload-collection-box {
    min-height: 360px;
  }

  .upload-collection-box__title {
    font-size: 30px;
  }

  .upload-collection-box__icon {
    font-size: 32px;
  }
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
  max-width: calc(100vw - 32px);
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

.collection-modal__label {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 0;
  margin: 0;
  font-family: "DM Sans", sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  color: #212529;
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
    padding: 0 16px;
  }

  .collection-modal__header {
    padding-top: 20px;
    padding-bottom: 12px;
  }

  .collection-modal__title {
    margin: 0;
    font-size: 20px;
    line-height: 1.35;
  }

  .collection-modal__body {
    flex: 1 1 auto;
    min-height: 0;
    padding: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    gap: 14px;
  }

  .collection-modal__label {
    font-size: 14px;
  }

  .collection-modal__input {
    height: 34px;
  }

  .collection-modal__textarea {
    min-height: 96px;
    height: 96px;
  }

  .collection-modal__footer {
    grid-row: 3;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
    align-self: stretch;
    box-sizing: border-box;
  }

  .collection-modal__btn {
    width: 100%;
    flex: 0 0 auto;
    min-height: 32px;
    height: 32px;
    padding: 2px 12px;
    line-height: 1.2;
  }

  .collection-modal__btn--secondary { order: 1; }
  .collection-modal__btn--primary { order: 2; }
}
</style>