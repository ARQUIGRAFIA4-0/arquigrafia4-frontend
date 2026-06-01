<template>
  <div class="arch-reads" :class="{ 'arch-reads--locked': !isLoggedIn }">

    <!-- Auth banner -->
    <div v-if="!isLoggedIn" class="arch-reads__auth-banner">
      Você ainda não acessou sua conta. Faça seu
      <RouterLink :to="{ name: 'login' }">login</RouterLink>
      e avalie a imagem.
    </div>

    <!-- Header -->
    <div class="arch-reads__header">
      <h2 class="arch-reads__title">
        Quais <strong>qualidades da arquitetura</strong> são <strong>visíveis nesta imagem</strong>?
      </h2>
    </div>

    <!-- Sliders -->
    <div class="arch-reads__sliders">
      <div v-for="pair in pairs" :key="pair.id" class="arch-reads__row">
        <span class="arch-reads__label arch-reads__label--left">{{ pair.left }}</span>

        <div class="arch-reads__track-wrapper">
          <input type="range" class="arch-reads__range" :id="`spec-${pair.id}`" min="0" max="100" step="1"
            v-model.number="pair.value" :disabled="!isLoggedIn" :aria-label="`${pair.left} / ${pair.right}`" />
        </div>

        <span class="arch-reads__label arch-reads__label--right">{{ pair.right }}</span>
      </div>
    </div>

    <!-- Submit -->
    <div class="arch-reads__footer">
      <button class="arch-reads__submit btn w-100" :disabled="!isLoggedIn || submitting || submitted"
        @click="handleSubmit" v-if="!submitted">
        <span v-if="submitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        <span v-if="submitting">Enviando...</span>
        <span v-else>Enviar avaliação</span>
      </button>
      <span v-else class="arch-reads__submit--success"><i class="bi bi-check-all"></i> Avaliação enviada</span>
    </div>

    <!-- Info box -->
    <div class="arch-reads__info">
      <div class="arch-reads__info-icon">
        <i class="bi bi-question-circle-fill" aria-hidden="true"></i>
      </div>
      <p class="arch-reads__info-text">
        O ARQUIGRAFIA convida o usuário a registrar impressões sobre fotos
        de arquitetura usando pares de opostos. As respostas geram um
        gráfico com médias e permitem comparar imagens com percepções
        parecidas entre os usuários.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/store/auth'
// import { useCommentStore } from '@/store/commentStore'
// import { useAuthStore } from '@/store/auth'

defineOptions({ name: 'ImageInterpretations' })

const props = defineProps({
  imageId: {
    type: [String, Number],
    default: null,
  },
})

const emit = defineEmits(['submit'])

const authStore = useAuthStore()
const isLoggedIn = computed(() => authStore.isLoggedIn)

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

async function handleSubmit() {
  if (!isLoggedIn.value || submitting.value || submitted.value) return

  submitting.value = true

  const payload = {
    imageId: props.imageId,
    ratings: pairs.value.reduce((acc, p) => {
      acc[p.id] = p.value
      return acc
    }, {}),
  }

  try {
    // TODO: trocar por chamada real à API
    await new Promise(resolve => setTimeout(resolve, 800))
    emit('submit', payload)
    submitted.value = true
  } catch (err) {
    console.error('Erro ao enviar avaliação:', err)
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 770px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

/* block */
.arch-reads {
  display: flex;
  flex-direction: column;
  padding: 0px 24px;

  &--locked {

    .arch-reads__title,
    .arch-reads__label {
      opacity: 0.4;
    }

    .arch-reads__range {
      opacity: 0.4;
      pointer-events: none;
    }

    .arch-reads__submit {
      opacity: 0.4;
      pointer-events: none;
    }
  }

  /* auth banner */
  &__auth-banner {
    background-color: var(--Laranja_C);
    border: 1px solid var(--Laranja_E);
    color: var(--Laranja_E);
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    text-align: center;

    a {
      color: var(--Azul_E);
      font-weight: 700;
      font-size: 0.75rem;
    }
  }

  /* header */
  &__header {
    padding-bottom: 4px;
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 400;
    line-height: 1.5;
    color: var(--Preto, #1a1a1a);
    margin: 0;
    margin-bottom: 20px;

    strong {
      font-weight: 700;
    }
  }

  /* sliders */
  &__sliders {
    display: flex;
    flex-direction: column;
    gap: 40px;
    margin-bottom: 64px;
    margin-top: 28px;

    @include md {
      gap: 24px;
    }
  }

  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    /* gap: 4px 12px; */
    /* gap: 24px; */
    position: relative;

    @include md {
      flex-wrap: nowrap; // volta a linha única no desktop
      /* gap: 12px; */
      gap: 4px 12px;
    }
  }

  /* labels */
  &__label {
    font-size: 1rem;
    color: var(--Preto, #1a1a1a);
    font-weight: 500;
    line-height: 1.5;
    white-space: nowrap;
    min-width: 88px;
    flex-shrink: 0;
    transition: color 0.2s ease;
    position: absolute;
    /* transform: translateY(-50%); */

    &--left {
      text-align: left;
      flex: 1;
      top: -30px;
      left: 0;

      @include md {
        flex: 0 0 auto;
      }
    }

    &--right {
      text-align: right;
      flex: 1;
      top: -30px;
      right: 0;

      @include md {
        flex: 0 0 auto;
        text-align: left;
      }
    }

    @include md {
      position: static;
    }
  }

  /* range track wrapper */
  &__track-wrapper {
    /* flex: 1; */
    flex: 0 0 100%;
    display: flex;
    align-items: center;

    @include md {
      flex: 1; // volta a ficar entre os labels
    }
  }

  /* native range input – cross-browser reset */
  &__range {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    background: var(--Cinza_C);
    border-radius: 10px;
    outline: none;
    cursor: pointer;
    margin: 0;

    /* ---- thumb: webkit */
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 0.875rem;
      height: 0.875rem;
      border-radius: 50%;
      background: var(--Cinza_E);
      border: 4px solid var(--Preto);
      cursor: pointer;
      transition: transform 0.15s ease, background 0.15s ease;
    }

    /* ---- thumb: firefox */
    &::-moz-range-thumb {
      width: 0.875rem;
      height: 0.875rem;
      border-radius: 50%;
      background: var(--Cinza_E);
      border: none;
      cursor: pointer;
      transition: transform 0.15s ease, background 0.15s ease;
    }

    /* ---- track: firefox */
    &::-moz-range-track {
      background: var(--Cinza_M);
      height: 3px;
      border-radius: 10px;
    }

    /* hover / focus states */
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
        box-shadow: 0 0 0 3px rgba(var(--Cinza_E), 0.18);
      }

      &::-moz-range-thumb {
        box-shadow: 0 0 0 3px rgba(var(--Cinza_E), 0.18);
      }
    }
  }

  /* submit button */
  &__footer {
    margin-bottom: 12px;
  }

  &__submit {
    background-color: var(--Preto, #1a1a1a);
    color: #fff;
    font-size: 0.875rem;
    font-weight: 400;
    border: none;
    border-radius: 5px;
    padding: 2px 14px;
    transition: background 0.2s ease, opacity 0.2s ease;

    &:hover:not(:disabled) {
      background-color: #333;
    }

    &:disabled {
      opacity: 0.6;
      cursor: default;
    }

    &--success {
      width: 100%;
      background-color: var(--Positivo_C);
      border: 1px solid var(--Positivo_E);
      border-radius: 4px;
      padding: 12px;
      padding-left: 16px;
      display: inline-flex;
      align-items: center;
      gap: 1.5rem;
      color: var(--Positivo_E);
      font-weight: 500;
      font-size: 0.875rem;
      position: relative;
      overflow: hidden;

      .bi {
        font-size: 1.25rem;
      }

      &::before {
        content: '';
        position: absolute;
        left: 0px;
        display: block;
        width: 4px;
        height: 100%;
        background: var(--Positivo_E);
      }
    }
  }

  /* info box */
  &__info {
    display: flex;
    gap: 24px;
    align-items: center;
    background: var(--Off_white);
    border: 1px solid var(--Cinza_M);
    border-left: none;
    border-radius: 6px;
    padding: 12px 12px;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      left: 0px;
      display: block;
      width: 4px;
      height: 100%;
      background: var(--Preto);
    }
  }

  &__info-icon {
    color: var(--Preto, #1a1a1a);
    flex-shrink: 0;

    .bi {
      font-size: 1rem;
    }
  }

  &__info-text {
    font-size: 0.75rem;
    color: var(--Cinza_e);
    line-height: 1.5;
    margin: 0;
  }
}
</style>