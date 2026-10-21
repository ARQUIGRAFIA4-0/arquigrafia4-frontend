<script setup>
import { computed, watch } from "vue";

defineOptions({ name: "CollectionPathModal" });

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // "create": cria o percurso da coleção
  // "create-partial": cria, avisando que nem todas as imagens têm localização
  // "create-blocked": nenhuma imagem tem localização; leva à revisão das imagens
  // "delete": apaga o percurso da coleção
  mode: {
    type: String,
    default: "create",
    validator: (value) =>
      ["create", "create-partial", "create-blocked", "delete"].includes(value),
  },
});

const emit = defineEmits(["update:modelValue", "confirm"]);

const COPY = {
  create: {
    title: "Deseja criar um percurso a partir dessa coleção?",
    paragraphs: [
      "Defina os pontos e a rota no mapa. A coleção continua a mesma, apenas ganha um percurso.",
    ],
    confirm: "Criar percurso",
  },
  "create-partial": {
    title: "Deseja criar um percurso a partir dessa coleção?",
    paragraphs: [
      "Nem todas as imagens dessa coleção possuem localização.",
      "Para ter uma visão completa, registre a localização em todas as imagens.",
    ],
    confirm: "Prosseguir",
  },
  "create-blocked": {
    title: "Antes de criar um percurso, localize as imagens",
    paragraphs: [
      "As imagens dessa coleção não possuem localização. Para criar um percurso, registre a localização de pelo menos uma das imagens.",
    ],
    confirm: "Revisar imagens da coleção",
  },
  delete: {
    title: "Apagar o percurso desta coleção?",
    paragraphs: [
      "Os pontos e a rota do percurso serão removidos. As imagens da coleção não são alteradas.",
    ],
    confirm: "Apagar percurso",
  },
};

const copy = computed(() => COPY[props.mode] ?? COPY.create);

function close() {
  emit("update:modelValue", false);
}

function confirm() {
  emit("confirm");
  close();
}

function handleEsc(event) {
  if (event.key === "Escape") close();
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    } else {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    }
  }
);
</script>

<template>
  <transition name="fade-modal">
    <div
      v-if="modelValue"
      class="path-modal__backdrop"
      @click.self="close"
    >
      <div
        class="path-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="path-modal-title"
      >
        <div class="path-modal__header">
          <h2 id="path-modal-title" class="path-modal__title">
            {{ copy.title }}
          </h2>
        </div>

        <div class="path-modal__body">
          <p
            v-for="(paragraph, index) in copy.paragraphs"
            :key="index"
            class="path-modal__text"
          >
            {{ paragraph }}
          </p>
        </div>

        <div class="path-modal__footer">
          <button
            type="button"
            class="path-modal__btn path-modal__btn--secondary"
            @click="close"
          >
            Voltar
          </button>
          <button
            type="button"
            class="path-modal__btn path-modal__btn--primary"
            @click="confirm"
          >
            {{ copy.confirm }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-modal-enter-active,
.fade-modal-leave-active {
  transition: opacity 0.2s ease;
}

.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
}

.path-modal__backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.5);
}

.path-modal__panel {
  display: flex;
  width: 596px;
  max-width: 100%;
  padding: 0 16px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  border-radius: 16px;
  background: var(--Off_white, #faf9f9);
  box-shadow: 4px 4px 8px 0 rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
}

.path-modal__header {
  display: flex;
  padding: 32px 32px 16px;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  align-self: stretch;
  box-sizing: border-box;
}

.path-modal__title {
  flex: 1 0 0;
  margin: 0;
  color: #2f2f2f;
  text-align: start;
  
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
}

.path-modal__body {
  display: flex;
  padding: 8px 32px;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  align-self: stretch;
  box-sizing: border-box;
}



.path-modal__text {
  margin: 0;
  align-self: stretch;
  color: var(--Cinza_E);
  text-align: start;
  
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
}



.path-modal__footer {
  display: flex;
  padding: 18px 0;
  justify-content: center;
  align-items: flex-start;
  gap: 16px;
  align-self: stretch;
  box-sizing: border-box;
}

.path-modal__btn {
  display: flex;
  height: 25px;
  min-height: 25px;
  padding: 2px 14px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 10px;
  flex: 1 0 0;
  min-width: 0;
  margin: 0;
  border-radius: 5px;
  border: 1px solid var(--Cinza_E);
  
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 150%;
  cursor: pointer;
  box-sizing: border-box;
}

.path-modal__btn--secondary {
  background: var(--Off_white, #faf9f9);
  color: var(--Cinza_E);
}

.path-modal__btn--primary {
  background: var(--Cinza_E);
  border-color: var(--Cinza_E);
  color: var(--Branco, #fff);
}

@media (max-width: 640px) {
  .path-modal__panel {
    width: 100%;
  }

  .path-modal__body {
    padding: 0 8px;
  }
}
</style>
