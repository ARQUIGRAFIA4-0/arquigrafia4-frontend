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

    <!-- ToDo: trocar para um skeleton -->
    <div v-if="loading" class="arch-reads__loading">
      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
      Carregando binômios...
    </div>

    <!-- Sliders -->
    <div class="arch-reads__sliders">
      <div v-for="pair in pairs" :key="pair.binomialId" class="arch-reads__row">
        <span class="arch-reads__label arch-reads__label--left">{{ pair.left }}</span>

        <div class="arch-reads__track-wrapper">

          <!-- ── custom track ──────────────────────────────────────────── -->
          <div class="arch-reads__track" :class="{ 'arch-reads__track--submitted': submitted }">

            <!-- outros usuários: um ponto por avaliação -->
            <span
              v-for="(val, i) in pair.othersValues"
              :key="i"
              class="arch-reads__dot arch-reads__dot--other"
              :style="{ left: val + '%' }"
              :title="'Avaliação de outro usuário: ' + val"
            />

            <!-- thumb do usuário logado (laranja) — só quando já avaliou -->
            <span
              v-if="submitted && pair.myValue !== null"
              class="arch-reads__dot arch-reads__dot--mine"
              :style="{ left: pair.myValue + '%' }"
              :title="'Sua avaliação: ' + pair.myValue"
            />

            <!-- input nativo — visível apenas antes de enviar -->
            <input
              v-if="!submitted"
              type="range"
              class="arch-reads__range"
              :id="`spec-${pair.binomialId}`"
              min="0"
              max="100"
              step="1"
              v-model.number="pair.value"
              :disabled="!isLoggedIn"
              :aria-label="`${pair.left} / ${pair.right}`"
            />
          </div>
          <!-- ─────────────────────────────────────────────────────────── -->

        </div>

        <span class="arch-reads__label arch-reads__label--right">
          {{ pair.right }}
        </span>
      </div>
    </div>

    <!-- Error -->
    <p v-if="error" class="arch-reads__error">{{ error }}</p>

    <!-- Submit -->
    <div class="arch-reads__footer">

      <span v-if="submitted" class="arch-reads__submit--success">
        <i class="bi bi-check-all"></i> Avaliação enviada
      </span> 
      
      <button
        v-if="!submitted"
        class="arch-reads__submit btn w-100"
        :disabled="submitting || loading"
        @click="handleSubmit"
      >
        <span v-if="submitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        <span v-if="submitting">Enviando...</span>
        <span v-else>Enviar avaliação</span>
      </button>

    <button
      v-else
      class="arch-reads__submit arch-reads__submit--update btn w-100"
      @click="submitted = false"
    >
      Atualizar avaliação
    </button>



      <!-- <button
        v-if="isLoggedIn"
        class="arch-reads__submit btn w-100" 
        :class="{ 'arch-reads__submit--update': submitted && !justUpdated }"
        :disabled="submitting || loading"
        @click="handleSubmit" 
      >
        <span v-if="submitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        <span v-if="submitting">{{ submitted ? 'Atualizando...' : 'Enviando...' }}</span>
        <span v-else-if="justUpdated"><i class="bi bi-check-all me-1"></i> Atualizado</span>
        <span v-else-if="submitted">Atualizar avaliação</span>
        <span v-else>Enviar avaliação</span>
      </button> -->

      <!-- ToDo: Fazer esse cara aparecer depois!!!-->
      
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
import { ref, computed, watch } from 'vue';
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import axios from 'axios'

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

// ── state ──────────────────────────────────────────────────────────────────
const pairs      = ref([])
const loading    = ref(true)
const submitting = ref(false)
const submitted   = ref(false)
const justUpdated = ref(false)
const error      = ref(null)

watch( 
  () => props.imageId,
    (id) => {
      if (!id) return 
      fetchBinomials()
      error.value = null
    },
    { immediate: true }
)

async function fetchBinomials() {
  if (!props.imageId) return

  loading.value = true
  error.value   = null

  try {
    const [respBinomials, respEvaluations] = await Promise.all([
      axios.get(`/api/images/${props.imageId}/binomials`, {headers: {
        "Content-Type": "application/json",
        Authorization: authStore.authHeader,
      },}),
      axios.get(`/api/images/${props.imageId}/binomials/evaluations`),
    ])
    
    const binomials   = respBinomials.data.data  ?? []
    const evaluations = respEvaluations.data.evaluations ?? []

    // my_value vem por binômio — null se nunca avaliou
    const myValuesMap = Object.fromEntries(
      binomials.map(b => [String(b.id), b.my_value ?? null])
    )
    console.log(myValuesMap);
    
    const userAlreadyEvaluated = binomials.some(b => b.my_value !== null)

    pairs.value = binomials
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(b => {
        const bid     = String(b.id)
        const myValue = myValuesMap[bid]

        return {
          binomialId:   b.id,
          left:         b.word_left,
          right:        b.word_right,
          value:        myValue ?? 50,   // posição inicial do range nativo
          myValue,                        // dot laranja após envio
          // pontos azuis — um por avaliador (todos, pois my_value já separa o usuário logado)
          othersValues: evaluations
            .map(e => e.values?.[bid])
            .filter(v => v !== undefined && v !== null),
        }
      })

    if (userAlreadyEvaluated) {
      submitted.value = true
    }
  } catch (err) {
    console.error('Erro ao buscar binômios:', err)
    error.value = 'Não foi possível carregar os binômios.'
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!isLoggedIn.value || submitting.value) return

  submitting.value = true
  submitted.value  = false
  error.value      = null

  const body = {
    evaluations: pairs.value.map(p => ({
      binomial_id: p.binomialId,
      value:       p.value,
    })),
  }

  try {
    const { data } = await axios.post(
      `/api/images/${props.imageId}/binomials`,
      body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: authStore.authHeader,
      },
    }
    )

    pairs.value = pairs.value.map(p => ({ ...p, myValue: p.value }))

    submitted.value = true
    justUpdated.value = true
    emit('submit', data)
  } catch (err) {
    console.error('Erro ao enviar avaliação:', err)
    error.value = 'Erro ao enviar avaliação. Tente novamente.'
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

   &__loading {
    font-size: 0.875rem;
    color: var(--Cinza_M, #6c757d);
    display: flex;
    align-items: center;
  }

  &__error {
    font-size: 0.8125rem;
    color: #dc3545;
    margin: 0;
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

  // Acts as the visual rail; dots and native input sit inside it.
  &__track {
    position: relative;
    width: 100%;
    height: 6px;
    background: var(--Cinza_C);
    border-radius: 999px;

    // native range is stretched over the track
    input[type="range"] {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
    }

    &--submitted {
        background: var(--Azul_C);
      }
  }

  // ── dots (other users + mine) ─────────────────────────────────────────────
  &__dot {
    position: absolute;
    top: 50%;
    width:  12px;
    height: 12px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;

    &--other {
      background: var(--Azul_C);
    }

    &--mine {
      width:  14px;
      height: 14px;
      background: var(--Laranja_M);
      border: 2px solid rgba(224, 124, 42, 0.185);
      z-index: 2;
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
    z-index: 1;

    &::-webkit-slider-runnable-track {
      height: 6px;
      background: transparent;
      border-radius: 999px;
    }

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width:  14px;
      height: 14px;
      border-radius: 50%;
      background: var(--Preto);
      border: none;
      margin-top: calc((#{6px} - #{14px}) / 2);
      transition: transform 0.15s ease;
    }

    &::-moz-range-track {
      height: 6px;
      background: transparent;
      border-radius: 999px;
    }

    &::-moz-range-thumb {
      width:  14px;
      height: 14px;
      border-radius: 50%;
      background: var(--Preto);
      border: none;
      transition: transform 0.15s ease;
    }

    &:not(:disabled):hover,
    &:not(:disabled):focus-visible {
      &::-webkit-slider-thumb { transform: scale(1.25); }
      &::-moz-range-thumb     { transform: scale(1.25); }
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