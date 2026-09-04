<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "confirm", "cancel"]);

// Placeholder temporário — trocar pelas imagens reais do tutorial.
const placeholderImg = "https://placehold.co/600x400";

const buscarImagem = (numero) => {
  return new URL(`../assets/uploadPlaceholder${numero}.png`, import.meta.url).href
}

const modalRef = ref(null);
let previouslyFocusedEl = null;

function close() {
  emit("update:modelValue", false);
}

function handleCancel() {
  emit("cancel");
  close();
}

function handleConfirm() {
  emit("confirm");
  close();
}

function handleKeydown(event) {
  if (event.key === "Escape" && props.modelValue) {
    handleCancel();
  }
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    if (isOpen) {
      previouslyFocusedEl = document.activeElement;
      await nextTick();
      modalRef.value?.focus();
    } else {
      previouslyFocusedEl?.focus?.();
    }
  }
);

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
  document.body.style.overflow = "";
});
</script>

<template>
  <Teleport to="body">
    <Transition name="uim-fade">
      <div
        v-if="modelValue"
        class="uim-overlay"
        @click.self="handleCancel"
      >
        <div
          ref="modalRef"
          class="uim-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="uim-title"
          tabindex="-1"
        >
          <div class="uim-modal__body">
            <h2 id="uim-title" class="uim-modal__title">
              Orientações para colaborar
            </h2>

            <!-- Tamanho máximo de arquivo -->
            <section class="uim-section">
              <p>
                O ARQUIGRAFIA aceita imagens com até 10Mb. Caso sua imagem
                seja muito grande, faça uma edição para convertê-la em um
                tamanho menor.
              </p>
              <div class="uim-resize-row">
                <img
                  src="../assets/uploadPlaceholder1.png"
                  alt="Exemplo de imagem em tamanho original"
                  class="uim-thumb uim-thumb--lg"
                />
                <i class="bi bi-arrow-right uim-arrow" aria-hidden="true"></i>
                <img
                  src="../assets/uploadPlaceholder1.png"
                  alt="Exemplo de imagem convertida para tamanho menor"
                  class="uim-thumb uim-thumb--md"
                />
              </div>
            </section>

            <!-- Quantidade de imagens -->
            <section class="uim-section">
              <p>Você pode enviar até 10 imagens por vez.</p>
              <div class="uim-grid">
                <img
                  v-for="n in 3"
                  :key="n"
                  :src="buscarImagem(n)"
                  :alt="`Exemplo de imagem enviada ${n}`"
                  class="uim-thumb uim-thumb--grid"
                />
                <div class="uim-grid__add" aria-hidden="true">
                  <i class="bi bi-plus-circle-fill"></i>
                </div>
              </div>
            </section>

            <!-- Evitar duplicadas -->
            <section class="uim-section">
              <p>
                O ARQUIGRAFIA é uma plataforma colaborativa e aberta. Sendo
                assim, a comunidade recomenda que você faça uma pré-seleção
                de suas imagens, evitando imagens duplicadas ou muito
                semelhantes.
              </p>
              <div class="uim-row">
                <img
                  src="../assets/uploadPlaceholder1.png"
                  alt="Exemplo de imagem original"
                  class="uim-thumb uim-thumb--flex"
                />
                <div class="uim-thumb-wrap">
                  <img
                    src="../assets/uploadPlaceholder1.png"
                    alt="Exemplo de imagem duplicada, não recomendada"
                    class="uim-thumb uim-thumb--flex uim-thumb--warning"
                  />
                  <span class="uim-warning-badge" aria-hidden="true">!</span>
                </div>
              </div>
            </section>

            <!-- Foco temático -->
            <section class="uim-section">
              <p>
                Buscamos difundir imagens de arquiteturas e do espaço
                construído nos contextos brasileiro e lusófono. Sendo assim,
                garanta que suas imagens tenham esses elementos como foco.
              </p>
              <div class="uim-row">
                <img
                  src="../assets/uploadPlaceholder1.png"
                  alt="Exemplo de imagem de arquitetura, dentro do foco"
                  class="uim-thumb uim-thumb--flex"
                />
                <div class="uim-thumb-wrap">
                  <img
                    src="../assets/uploadPlaceholder4.png"
                    alt="Exemplo de imagem fora do foco temático, não recomendada"
                    class="uim-thumb uim-thumb--flex uim-thumb--warning"
                  />
                  <span class="uim-warning-badge" aria-hidden="true">!</span>
                </div>
                <img
                  src="../assets/uploadPlaceholder3.png"
                  alt="Exemplo de imagem de arquitetura, dentro do foco"
                  class="uim-thumb uim-thumb--flex"
                />
              </div>
            </section>
          </div>

          <div class="uim-modal__footer">
            <button
              type="button"
              class="btn btn-outline-secondary uim-modal__btn"
              @click="handleCancel"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-dark uim-modal__btn"
              @click="handleConfirm"
            >
              Selecionar imagens
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.uim-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: stretch;
  justify-content: center;
  z-index: 2000;
  padding: 0;

  @include md {
    align-items: center;
    padding: 24px;
  }
}

.uim-modal {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 720px;
  height: 100%;
  max-height: 100vh;
  background-color: #fbfbfa;
  border-radius: 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  outline: none;

  @include md {
    height: auto;
    max-height: 88vh;
    border-radius: 20px;
  }

  &__body {
    overflow-y: auto;
    padding: 24px 20px 8px;

    @include md {
      padding: 40px 48px 16px;
    }
  }

  &__title {
    font-weight: 600;
    font-size: 22px;
    line-height: 130%;
    margin: 0 0 20px;
    color: #1f1f1f;

    @include md {
      font-size: 30px;
      margin-bottom: 28px;
    }
  }

  &__footer {
    display: flex;
    flex-direction: column-reverse;
    gap: 10px;
    padding: 16px 20px calc(16px + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid #e6e5e3;
    background-color: #fbfbfa;

    @include md {
      flex-direction: row;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px 48px;
    }
  }

  &__btn {
    width: 100%;
    justify-content: center;
    font-weight: 400;
    font-size: 14px;
    line-height: 150%;

    @include md {
      width: auto;
    }
  }
}

.uim-section {
  margin-bottom: 28px;

  &:last-child {
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    line-height: 150%;
    color: #333;
    margin: 0 0 16px;

    @include md {
      font-size: 16px;
    }
  }
}

// Linha 1: imagem original -> seta -> imagem convertida
.uim-resize-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;

  @include md {
    gap: 24px;
  }
}

.uim-arrow {
  flex-shrink: 0;
  font-style: normal;
  font-size: 20px;
  color: #1f1f1f;

  @include md {
    font-size: 28px;
  }
}

// Linha 2: grade de exemplos + botão "adicionar"
.uim-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;

  @include md {
    gap: 16px;
  }

  &__add {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1 / 1;
    border-radius: 8px;
    border: 1px solid #2f2f2f;

    i {
      font-size: 22px;
      color: #575757;

      @include md {
        font-size: 32px;
      }
    }
  }
}

// Linhas 3 e 4: pares/trios de exemplos, com destaque de alerta
.uim-row {
  display: flex;
  gap: 8px;

  @include md {
    gap: 16px;
  }
}

.uim-thumb {
  width: 100%;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid transparent;
  display: block;

  &--lg {
    width: 42%;
    max-width: 220px;
    aspect-ratio: 4 / 3;
  }

  &--md {
    width: 34%;
    max-width: 175px;
    aspect-ratio: 4 / 3;
  }

  &--grid {
    aspect-ratio: 1 / 1;
  }

  &--flex {
    flex: 1 1 0;
    aspect-ratio: 4 / 3;
    min-width: 0;
  }

  &--warning {
    border-color: #e5252c;
  }
}

.uim-thumb-wrap {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
}

.uim-warning-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background-color: #e5252c;
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  @include md {
    width: 32px;
    height: 32px;
    font-size: 18px;
    top: -12px;
    right: -12px;
  }
}

.uim-fade-enter-active,
.uim-fade-leave-active {
  transition: opacity 0.2s ease;
}

.uim-fade-enter-from,
.uim-fade-leave-to {
  opacity: 0;
}
</style>