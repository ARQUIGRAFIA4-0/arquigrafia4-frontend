<script setup>
import { computed, watch, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";

/**
 * Menu em tela cheia (fullscreen), usado tanto para o menu institucional
 * ("Sobre", aberto pelo ícone de três pontos) quanto para o menu de perfil
 * (aberto pelo avatar), conforme os mockups do time de design:
 *
 *  - Mobile: ocupa a tela toda, com botão "X" para fechar e o bloco de
 *    marca (logo + informações do acervo) empurrado para o rodapé.
 *  - Desktop (>= $breakpoint-md): vira um painel de duas colunas — marca à
 *    esquerda, lista de opções à direita — mantendo o header real visível
 *    por cima (ver truque de z-index nos estilos + AppHeader.vue).
 *
 * O componente não conhece rotas de autenticação/logout: quem chama decide
 * o que fazer no evento "logout", mantendo este componente reutilizável.
 */

const props = defineProps({
  show: { type: Boolean, default: false },
  // "about"   -> itens institucionais (Sobre, Membros, Políticas...)
  // "profile" -> itens de conta (Ver perfil, Editar perfil, Sair...)
  mode: {
    type: String,
    default: "about",
    validator: (value) => ["about", "profile"].includes(value),
  },
  isLoggedIn: { type: Boolean, default: false },
  avatarUrl: { type: String, default: null },
  // TODO: substituir pelo total real do acervo (endpoint/store) quando
  // essa informação estiver disponível fora do componente.
  photoCount: { type: [String, Number], default: "14030" },
});

const emit = defineEmits(["update:show", "logout"]);

const route = useRoute();

const aboutItems = [
  { label: "Sobre", to: "/about/project" },
  { label: "Membros", to: "/about/members" },
  { label: "Políticas", to: "/about/policies" },
  // Renomeado de "FAQ" para "Código aberto" no novo design; rota mantida
  // até confirmação do time — ajustar aqui se o destino mudar.
  { label: "Código aberto", to: "/about/faq" },
  { label: "Vocabulário", to: "/about/vocabulary" },
];

const profileItems = [
  { label: "Ver perfil", to: "/eu" },
  { label: "Editar perfil", to: "/eu/editar" },
  { label: "Criar coletivo", to: "/coletivos/criar" },
];

const isProfileMode = computed(() => props.mode === "profile");

function close() {
  emit("update:show", false);
}

function handleLogout() {
  emit("logout");
  close();
}

function handleKeydown(event) {
  if (event.key === "Escape") close();
}

// Trava o scroll do body e escuta o "Esc" enquanto o menu está aberto
watch(
  () => props.show,
  (isOpen) => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    if (isOpen) {
      window.addEventListener("keydown", handleKeydown);
    } else {
      window.removeEventListener("keydown", handleKeydown);
    }
  }
);

onBeforeUnmount(() => {
  document.body.style.overflow = "";
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <!--
    Teleport para o body: assim o overlay vira IRMÃO do <header> no DOM
    (em vez de filho dele). Isso é essencial para o truque de z-index
    funcionar — z-index só decide a ordem entre elementos que disputam o
    mesmo contexto de empilhamento. Se o overlay ficasse aninhado dentro do
    <header>, o seu z-index (1029) venceria os filhos internos do header
    (logo, ícones, nav, que têm z-index bem menor) e cobriria o próprio
    header por dentro — foi exatamente o bug visto no preview.
  -->
  <Teleport to="body">
  <Transition name="menu-fade">
    <div
      v-if="show"
      class="app-menu-overlay"
      role="dialog"
      aria-modal="true"
      :aria-label="isProfileMode ? 'Menu de perfil' : 'Menu institucional'"
      @click.self="close"
    >
      <!-- Botão fechar: visível só no mobile (imagem "Menu_aberto"). No
           desktop fecha clicando fora, clicando de novo no ícone que abriu,
           ou com Esc — como nos mockups de desktop, sem "X" visível. -->
      <button
        type="button"
        class="app-menu-overlay__close d-md-none"
        aria-label="Fechar menu"
        @click="close"
      >
        <i class="bi bi-x-lg"></i>
      </button>

      <div class="app-menu-overlay__content">
        <div class="app-menu-overlay__brand-desktop d-none d-md-block">
          <img
            src="../assets/logo_footer.png"
            alt="Arquigrafia"
            class="app-menu-overlay__brand-logo"
          />

          <!-- <nav class="app-menu-overlay__brand-links d-none d-md-flex">
            <router-link
              v-for="(item, index) in aboutItems"
              :key="item.to"
              :to="item.to"
              @click="close"
            >
              {{ item.label.toLowerCase() }}<span v-if="index < aboutItems.length - 1">&nbsp;·</span>
            </router-link>
          </nav> -->

          <p class="app-menu-overlay__brand-text">
            Nosso acervo conta com {{ photoCount }} fotos.
          </p>
          <p class="app-menu-overlay__brand-text">
            Este site possui uma licença
            <a
              href="https://creativecommons.org/licenses/by/3.0/"
              target="_blank"
              rel="noopener"
            >Creative Commons Attribution 3.0</a>
          </p>
        </div>

        <nav class="app-menu-overlay__list">
          <template v-if="isProfileMode">
            <template v-if="isLoggedIn">
              <router-link
                v-for="item in profileItems"
                :key="item.to"
                :to="item.to"
                class="app-menu-overlay__link"
                :class="{ 'is-active': route.path.startsWith(item.to) }"
                @click="close"
              >
                {{ item.label }}
              </router-link>
              <button
                type="button"
                class="app-menu-overlay__link app-menu-overlay__link--button"
                @click="handleLogout"
              >
                Sair
              </button>
            </template>
            <template v-else>
              <router-link to="/login" class="app-menu-overlay__link" @click="close">
                Entrar
              </router-link>
            </template>
          </template>

          <template v-else>
            <router-link
              v-for="item in aboutItems"
              :key="item.to"
              :to="item.to"
              class="app-menu-overlay__link"
              :class="{ 'is-active': route.path.startsWith(item.to) }"
              @click="close"
            >
              {{ item.label }}
            </router-link>
          </template>
        </nav>
      </div>
      <div class="app-menu-overlay__brand">
            <img
                src="../assets/logo_footer.png"
                alt="Arquigrafia"
                class="app-menu-overlay__brand-logo"
            />

            <nav class="app-menu-overlay__brand-links d-md-flex">
                <router-link
                v-for="(item, index) in aboutItems"
                :key="item.to"
                :to="item.to"
                @click="close"
                >
                {{ item.label.toLowerCase() }}<span v-if="index < aboutItems.length - 1">&nbsp;·</span>
                </router-link>
            </nav>

            <p class="app-menu-overlay__brand-text">
                Nosso acervo conta com {{ photoCount }} fotos.
            </p>
            <p class="app-menu-overlay__brand-text">
                Este site possui uma licença
                <a
                href="https://creativecommons.org/licenses/by/3.0/"
                target="_blank"
                rel="noopener"
                >Creative Commons Attribution 3.0</a>
            </p>
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

.app-menu-overlay {
  position: fixed;
  inset: 0;
  // Um ponto abaixo do .app-header (z-index: 1030) para que o header real
  // — logo, abas Explore/Colabore, avatar, ícone de três pontos — continue
  // visível por cima deste overlay em qualquer breakpoint.
  z-index: 1029;
  display: flex;
  flex-direction: column;
  background-color: var(--Branco, #ffffff);
  overflow-y: auto;
  padding: 1.5rem 1rem 2rem;

  
  @include md {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding: 0 50px;
      
      justify-content: center;
  }
}

.app-menu-overlay__close {
  align-self: flex-end;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background-color: var(--Cinza_E, #222222);
  color: var(--Branco, #ffffff);
  font-size: 18px;
  margin-bottom: 2rem;

  position: relative;
  top: 100px;
}

.app-menu-overlay__content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    
    width: 100%;
    max-width: 1027px;

    @include md {
        flex-direction: row;
        align-items: flex-end;
        // justify-content: space-between;
        gap: 3rem;
        width: 100%;

    }
}

.app-menu-overlay__brand-desktop {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: left;
    margin-bottom: 2rem;
    
    @include md {
        display: none;
        margin-bottom: 0;
    }
}

.app-menu-overlay__brand {
    // margin-top: auto;
    text-align: left;
    padding: 16px 16px;

    @include md {
        margin-top: 0;
        max-width: 420px;
        order: 1;
        display: none;
    }
}

.app-menu-overlay__brand-logo {
  height: 34px;
  width: auto;
  margin-bottom: 1rem;

  @include md {
    height: 100%;
    width: 50%;
  }
}

.app-menu-overlay__brand-links {
  flex-wrap: wrap;
  margin-bottom: 1rem;
  display: flex;
  gap: 4px;

  a {
    color: var(--Cinza_E);
    font-weight: 700;
    font-size: 14px;
    text-decoration: none;

    span {
        margin: 0 4px;
    }
  }
}

.app-menu-overlay__brand-text {
  color: var(--Cinza_C);
  font-size: 10px;
  line-height: 16px;
  margin-bottom: 0.25rem;
  font-weight: 400;

  a {
    color: inherit;
    text-decoration: underline;
    font-size: 10px;
  }
}

.app-menu-overlay__list {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  text-align: center;

  @include md {
    flex: 0 0 auto;
    align-items: flex-start;
    text-align: left;
    order: 2;
    gap: 2.5rem;
  }
}

.app-menu-overlay__link {
  border: none;
  background: none;
  padding: 0;
  color: var(--Cinza_E);
  font-weight: 600;
  font-size: 26px;
  line-height: 100%;
  text-decoration: none;
  cursor: pointer;

  &.is-active {
    color: var(--Laranja_E);
  }

  @include md {
    font-size: 28px;
  }
}

// Transição fade no mesmo padrão já usado no projeto (ver
// .copy-toast-fade-* em HomePage.vue), espelhando o comportamento de
// fade/show do Bootstrap.
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.2s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
}
</style>