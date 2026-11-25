<template>
  <component
    :is="elemento"
    v-bind="atributos"
    class="ui-item-lista"
    :class="{
      'ui-item-lista--ativo': estaAtivo,
      'ui-item-lista--interativo': elemento === 'a',
    }"
  >
    <span class="ui-item-lista__conteudo">
      <span v-if="imagem" class="ui-item-lista__imagem">
        <img
          v-if="!imagemFalhou"
          :src="imagem"
          :alt="imagemAlt"
          @error="imagemFalhou = true"
        />
      </span>
      <span class="ui-item-lista__textos">
        <span class="ui-item-lista__titulo">{{ titulo }}</span>
        <span v-if="subtitulo" class="ui-item-lista__subtitulo">
          {{ subtitulo }}
        </span>
      </span>
    </span>
    <i class="bi bi-arrow-right ui-item-lista__seta" aria-hidden="true" />
  </component>
</template>

<script setup>
import { computed, ref, toRef, watch } from "vue";
import { useLink } from "vue-router";

defineOptions({ name: "UiItemLista" });

const props = defineProps({
  titulo: {
    type: String,
    required: true,
  },
  subtitulo: {
    type: String,
    default: "",
  },
  imagem: {
    type: String,
    default: "",
  },
  imagemAlt: {
    type: String,
    default: "",
  },
  ativo: {
    type: Boolean,
    default: false,
  },
  to: {
    type: [String, Object],
    default: null,
  },
  href: {
    type: String,
    default: "",
  },
});

// `useLink` não aceita `to` vazio; o tipo do item (link de rota ou não) é
// decidido na montagem.
const link = props.to ? useLink({ to: toRef(props, "to") }) : null;

const estaAtivo = computed(
  () => props.ativo || Boolean(link && link.isActive.value),
);

const elemento = computed(() => (link || props.href ? "a" : "div"));

const atributos = computed(() => {
  if (link) {
    return {
      href: link.href.value,
      onClick: link.navigate,
      "aria-current": estaAtivo.value ? "page" : undefined,
    };
  }
  if (props.href) {
    return {
      href: props.href,
      "aria-current": estaAtivo.value ? "page" : undefined,
    };
  }
  return {};
});

const imagemFalhou = ref(false);
watch(
  () => props.imagem,
  () => {
    imagemFalhou.value = false;
  },
);
</script>

<style scoped>
/* Medidas do "item lista" do LINA (Dispositivo=mobile; desktop no media query). */
.ui-item-lista {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--espaco-p);
  padding: var(--espaco-ppp) var(--espaco-ppp) var(--espaco-pp);
  border-bottom: var(--item-lista-borda) solid var(--Cinza_C);
  color: var(--Preto);
  text-decoration: none;
}

.ui-item-lista__conteudo {
  display: flex;
  align-items: center;
  gap: var(--espaco-p);
  min-width: 0;
}

.ui-item-lista__imagem {
  flex: 0 0 auto;
  width: var(--item-lista-imagem);
  height: var(--item-lista-imagem);
  overflow: hidden;
  border-radius: 50%;
  background-color: var(--Laranja_E);
}

.ui-item-lista__imagem img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ui-item-lista__textos {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.ui-item-lista__titulo {
  font-size: var(--item-lista-titulo-fs);
  font-weight: var(--item-lista-titulo-fw);
  line-height: var(--item-lista-titulo-lh);
}

.ui-item-lista__subtitulo {
  color: var(--Cinza_M);
  font-size: var(--rotulo-fs);
  font-weight: var(--rotulo-fw);
  line-height: var(--rotulo-lh);
  font-variation-settings: var(--fonte-9pt);
}

.ui-item-lista__seta {
  flex: 0 0 auto;
  color: var(--Cinza_M);
  font-size: var(--item-lista-seta);
  line-height: 1;
}

/* Ativo: definido no Figma Interfaces (menu da página Sobre). */
.ui-item-lista--ativo .ui-item-lista__titulo,
.ui-item-lista--ativo .ui-item-lista__seta {
  color: var(--Laranja_E);
}

/* Hover e foco (só quando o item é link). */
.ui-item-lista--interativo:hover .ui-item-lista__titulo,
.ui-item-lista--interativo:hover .ui-item-lista__seta {
  color: var(--Laranja_E);
}

.ui-item-lista--interativo:focus-visible {
  outline: var(--foco-largura) solid var(--foco-cor);
  outline-offset: var(--foco-afastamento);
}

@media (min-width: 768px) {
  .ui-item-lista {
    gap: var(--espaco-m);
    padding-bottom: var(--espaco-p);
  }

  .ui-item-lista__conteudo {
    gap: var(--espaco-m);
  }

  .ui-item-lista__textos {
    gap: var(--espaco-ppp);
  }
}
</style>
