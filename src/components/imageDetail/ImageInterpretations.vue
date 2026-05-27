<template>
  <div class="arch-reads">
    <!-- Header -->
    <div class="arch-reads__header">
      <h2 class="arch-reads__title">
        Quais <strong>qualidades da arquitetura</strong> são visíveis nesta imagem?
      </h2>
    </div>

    <!-- Sliders -->
    <div class="arch-reads__sliders">
      <div v-for="pair in pairs" :key="pair.id" class="arch-reads__row">
        <span class="arch-reads__label arch-reads__label--left">{{ pair.left }}</span>

        <div class="arch-reads__track-wrapper">
          <input type="range" class="arch-reads__range" :id="`spec-${pair.id}`" min="0" max="100" step="1"
            v-model.number="pair.value" :aria-label="`${pair.left} / ${pair.right}`" />
        </div>

        <span class="arch-reads__label arch-reads__label--right">{{ pair.right }}</span>
      </div>
    </div>

    <!-- Submit -->
    <div class="arch-reads__footer">
      <button class="arch-reads__submit btn w-100" :disabled="submitting || submitted" @click="handleSubmit">
        <span v-if="submitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        <span v-if="submitted">✓ Avaliação enviada</span>
        <span v-else-if="submitting">Enviando...</span>
        <span v-else>Enviar avaliação</span>
      </button>
    </div>

    <!-- Info box -->
    <div class="arch-reads__info">
      <div class="arch-reads__info-icon">
        <i class="bi bi-question-circle" aria-hidden="true"></i>
      </div>
      <p class="arch-reads__info-text">
        O <strong>ARQUIGRAFIA</strong> convida o usuário a registrar impressões sobre fotos
        de arquitetura usando pares de opostos. As respostas geram um
        gráfico com médias e permitem comparar imagens com percepções
        parecidas entre os usuários.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineOptions({ name: 'ImageInterpretations' })

// const props = defineProps({
//   imageId: {
//     type: [String, Number],
//     default: null,
//   },
// })

// const emit = defineEmits(['submit'])

const pairs = ref([
  { id: 'aberta', left: 'Aberta', right: 'Fechada', value: 50 },
  { id: 'interna', left: 'Interna', right: 'Externa', value: 50 },
  { id: 'complexa', left: 'Complexa', right: 'Simples', value: 50 },
  { id: 'simetrica', left: 'Simétrica', right: 'Assimétrica', value: 50 },
  { id: 'translucida', left: 'Translúcida', right: 'Opaca', value: 50 },
  { id: 'horizontal', left: 'Horizontal', right: 'Vertical', value: 50 },
])

const submitting = ref(false)
const submitted = ref(false)

// async function handleSubmit() {
//   if (submitting.value || submitted.value) return

//   submitting.value = true

//   const payload = {
//     imageId: props.imageId,
//     ratings: pairs.value.reduce((acc, p) => {
//       acc[p.id] = p.value
//       return acc
//     }, {}),
//   }

//   try {
//     // TODO: trocar por chamada real à API
//     await new Promise(resolve => setTimeout(resolve, 800))
//     emit('submit', payload)
//     submitted.value = true
//   } catch (err) {
//     console.error('Erro ao enviar avaliação:', err)
//   } finally {
//     submitting.value = false
//   }
// }
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;

// ─── tokens ────────────────────────────────────────────────────────────────
$track-color: #d1d5db;
$thumb-color: #1a1a1a;
$thumb-size: 14px;
$track-height: 3px;
$label-width: 88px;

// ─── block ─────────────────────────────────────────────────────────────────
.arch-reads {
  display: flex;
  flex-direction: column;
  gap: 24px;

  // ── header ───────────────────────────────────────────────────────────────
  &__header {
    padding-bottom: 4px;
  }

  &__title {
    font-size: 0.9375rem; // 15px
    font-weight: 400;
    line-height: 1.5;
    color: var(--Preto, #1a1a1a);
    margin: 0;

    strong {
      font-weight: 700;
    }
  }

  // ── sliders ───────────────────────────────────────────────────────────────
  &__sliders {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  // ── labels ────────────────────────────────────────────────────────────────
  &__label {
    font-size: 0.875rem;
    color: var(--Preto, #1a1a1a);
    white-space: nowrap;
    min-width: $label-width;
    flex-shrink: 0;

    &--left {
      text-align: left;
    }

    &--right {
      text-align: right;
    }
  }

  // ── range track wrapper ───────────────────────────────────────────────────
  &__track-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
  }

  // ── native range input – cross-browser reset ──────────────────────────────
  &__range {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: $track-height;
    background: $track-color;
    border-radius: 999px;
    outline: none;
    cursor: pointer;
    margin: 0;

    // ---- thumb: webkit
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: $thumb-size;
      height: $thumb-size;
      border-radius: 50%;
      background: $thumb-color;
      border: none;
      cursor: pointer;
      transition: transform 0.15s ease, background 0.15s ease;
    }

    // ---- thumb: firefox
    &::-moz-range-thumb {
      width: $thumb-size;
      height: $thumb-size;
      border-radius: 50%;
      background: $thumb-color;
      border: none;
      cursor: pointer;
      transition: transform 0.15s ease, background 0.15s ease;
    }

    // ---- track: firefox
    &::-moz-range-track {
      background: $track-color;
      height: $track-height;
      border-radius: 999px;
    }

    // hover / focus states
    &:hover,
    &:focus-visible {
      &::-webkit-slider-thumb {
        transform: scale(1.25);
      }

      &::-moz-range-thumb {
        transform: scale(1.25);
      }
    }

    &:focus-visible {
      &::-webkit-slider-thumb {
        box-shadow: 0 0 0 3px rgba($thumb-color, 0.18);
      }

      &::-moz-range-thumb {
        box-shadow: 0 0 0 3px rgba($thumb-color, 0.18);
      }
    }
  }

  // ── submit button ─────────────────────────────────────────────────────────
  &__footer {
    margin-top: 4px;
  }

  &__submit {
    background-color: var(--Preto, #1a1a1a);
    color: #fff;
    font-size: 0.875rem;
    font-weight: 500;
    letter-spacing: 0.01em;
    border: none;
    border-radius: 4px;
    padding: 10px 16px;
    transition: background 0.2s ease, opacity 0.2s ease;

    &:hover:not(:disabled) {
      background-color: #333;
    }

    &:disabled {
      opacity: 0.6;
      cursor: default;
    }
  }

  // ── info box ──────────────────────────────────────────────────────────────
  &__info {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 14px 16px;
  }

  &__info-icon {
    font-size: 1rem;
    color: var(--Cinza_M, #6c757d);
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__info-text {
    font-size: 0.8125rem; // 13px
    color: var(--Cinza_M, #6c757d);
    line-height: 1.55;
    margin: 0;

    strong {
      color: var(--Preto, #1a1a1a);
      font-weight: 600;
    }
  }
}
</style>