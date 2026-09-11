<script setup>
import { reactive, computed, watch, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";

/**
 * Menu em tela cheia (fullscreen), unificado: junta o que antes eram dois
 * menus separados ("Sobre" e "Perfil") em um único painel com acordeão,
 * conforme o novo design (Menu_completo / Menu_lateral):
 *
 *  - Coletivos: avatares dos coletivos do usuário + botão "+" (criar
 *    coletivo).
 *  - Acordeão "Sobre" (Membros, Políticas) e "Perfil" (Meu perfil, Editar
 *    perfil) — os dois podem ficar abertos ao mesmo tempo, de forma
 *    independente.
 *  - Itens fixos fora do acordeão: FAQ e Sair.
 *  - Logo + informações do acervo, ancorados com position: absolute no
 *    canto inferior para não se mexerem quando o acordeão abre/fecha.
 *  - Botão "X" para fechar, visível em qualquer breakpoint.
 */

const props = defineProps({
  show: { type: Boolean, default: false },
  isLoggedIn: { type: Boolean, default: false },
  avatarUrl: { type: String, default: null },
  // TODO: substituir pelo total real do acervo (endpoint/store) quando
  // essa informação estiver disponível fora do componente.
  photoCount: { type: [String, Number], default: "14030" },
  // Coletivos do usuário logado: [{ id, name, avatarUrl }]
  collectives: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:show", "logout"]);

const route = useRoute();

// Mostra no máximo 2 coletivos aqui; para ver o resto, o usuário passa
// pela bolinha de perfil (ela leva pro perfil, que lista todos).
const MAX_VISIBLE_COLLECTIVES = 2;
const visibleCollectives = computed(() =>
  props.collectives.slice(0, MAX_VISIBLE_COLLECTIVES)
);

const sobreItems = [
  { label: "ARQUIGRAFIA 4.0", to: "/about/project" },
  { label: "Membros", to: "/about/members" },
  { label: "Políticas", to: "/about/policies" },
  { label: "Vocabulário", to: "/about/vocabulary" },
];

const perfilItems = [
  { label: "Meu perfil", to: "/eu/imagens" },
  { label: "Editar perfil", to: "/eu/editar" },
];


const openSections = reactive({
  sobre: false,
  perfil: false,
});

function toggleSection(key) {
  const wasOpen = openSections[key];
  openSections.sobre = false;
  openSections.perfil = false;
  openSections[key] = !wasOpen;
}

function initials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

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
    funcionar — se o overlay ficasse aninhado dentro do <header>, o seu
    z-index venceria os filhos internos do header (logo, ícones, nav) e
    cobriria o próprio header por dentro.
  -->
  <Teleport to="body">
    <Transition name="menu-fade">
      <div
        v-if="show"
        class="app-menu-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        @click.self="close"
      >
        <button
          type="button"
          class="app-menu-overlay__close"
          aria-label="Fechar menu"
          @click="close"
        >
          <i class="bi bi-x-lg"></i>
        </button>

        <!-- Logo + informações do acervo: position absolute (ver estilos)
             para não se mexer quando o acordeão à direita abre/fecha. -->
        <div class="app-menu-overlay__brand">
          <img
            src="../assets/logo_footer.png"
            alt="Arquigrafia"
            class="app-menu-overlay__brand-logo"
          />
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

        <div class="app-menu-overlay__content">
          <!-- Coletivos -->
          <section class="app-menu-overlay__section">
            <h2 class="app-menu-overlay__section-title">Coletivos</h2>
            <div class="app-menu-overlay__collectives">
              <router-link
                v-for="collective in visibleCollectives"
                :key="collective.id"
                :to="`/coletivos/${collective.id}`"
                class="app-menu-overlay__collective-avatar"
                :title="collective.name"
                @click="close"
              >
                <img v-if="collective.avatarUrl" :src="collective.avatarUrl" :alt="collective.name" />
                <span v-else>{{ initials(collective.name) }}</span>
              </router-link>
              <!-- Bolinha do próprio usuário: leva pro perfil, de onde dá
                   pra ver os demais coletivos (além dos 2 exibidos aqui). -->
              <router-link
                v-if="visibleCollectives.length > 1"
                to="/eu/imagens"
                class="app-menu-overlay__collective-avatar app-menu-overlay__collective-profile"
                title="Ver todos os coletivos"
                @click="close"
              >
                <i class="bi bi-three-dots"></i>
              </router-link>
              <router-link
                to="/coletivos/criar"
                class="app-menu-overlay__collective-add"
                aria-label="Criar coletivo"
                title="Criar coletivo"
                @click="close"
              >
                <i class="bi bi-plus-lg"></i>
              </router-link>
            </div>
          </section>

          <!-- Acordeão unificado -->
          <nav class="app-menu-overlay__accordion">
            <div class="app-menu-overlay__accordion-item">
              <button
                type="button"
                class="app-menu-overlay__accordion-trigger"
                :class="{ 'is-open': openSections.sobre }"
                :aria-expanded="openSections.sobre"
                @click="toggleSection('sobre')"
              >
                <span>Sobre</span>
                <i class="bi bi-chevron-down app-menu-overlay__chevron" :class="{ 'is-open': openSections.sobre }"></i>
              </button>
              <div class="app-menu-overlay__accordion-panel-wrapper" :class="{ 'is-open': openSections.sobre }">
                <div class="app-menu-overlay__accordion-panel">
                  <router-link
                    v-for="item in sobreItems"
                    :key="item.to"
                    :to="item.to"
                    class="app-menu-overlay__link"
                    :class="{ 'is-active': route.path === item.to }"
                    @click="close"
                  >
                    {{ item.label }}
                  </router-link>
                </div>
              </div>
            </div>

            <template v-if="isLoggedIn">
              <div class="app-menu-overlay__accordion-item">
                <button
                  type="button"
                  class="app-menu-overlay__accordion-trigger"
                  :class="{ 'is-open': openSections.perfil }"
                  :aria-expanded="openSections.perfil"
                  @click="toggleSection('perfil')"
                >
                  <span>Perfil</span>
                  <i class="bi bi-chevron-down app-menu-overlay__chevron" :class="{ 'is-open': openSections.perfil }"></i>
                </button>
                <div class="app-menu-overlay__accordion-panel-wrapper" :class="{ 'is-open': openSections.perfil }">
                  <div class="app-menu-overlay__accordion-panel">
                    <router-link
                      v-for="item in perfilItems"
                      :key="item.to"
                      :to="item.to"
                      class="app-menu-overlay__link"
                      :class="{ 'is-active': route.path === item.to }"
                      @click="close"
                    >
                      {{ item.label }}
                    </router-link>
                  </div>
                </div>
              </div>
            </template>
            <router-link v-else to="/login" class="app-menu-overlay__link app-menu-overlay__accordion-item" @click="close">
              Entrar
            </router-link>

            <router-link to="/about/faq" class="app-menu-overlay__link app-menu-overlay__accordion-item" @click="close">
              FAQ
            </router-link>

            <button
              v-if="isLoggedIn"
              type="button"
              class="app-menu-overlay__link app-menu-overlay__link--top app-menu-overlay__link--button app-menu-overlay__accordion-item"
              @click="handleLogout"
            >
              Sair
            </button>
          </nav>
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
  display:  flex;
  flex-direction: column-reverse;
  justify-content: space-between;

  inset: 0;
  // Um ponto abaixo do .app-header (z-index: 1030) para que o header real
  // continue visível por cima deste overlay em qualquer breakpoint.
  z-index: 1029;
  overflow-y: auto;
  background-color: var(--Branco, #ffffff);
  // padding-top maior para abrir espaço para o botão "X", que agora fica
  // absolute e visível em qualquer largura de tela.
  // padding-top: 120px;
  padding-top: 160px;
  gap: 64px;

  @include md {
    // padding: 6.5rem 50px 3rem;
    // margin: auto;
    flex-direction: row;
    justify-content: space-around;
    padding-bottom: 64px;
  }
}

// Fecha o menu: agora visível em qualquer breakpoint (antes só aparecia no
// mobile). Fica com position: absolute para não interferir no fluxo do
// conteúdo abaixo dele.
.app-menu-overlay__close {
  position: absolute;
  // position: relative;
  top: 120px;
  right: 24px;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background-color: var(--Cinza_E, #222222);
  color: var(--Branco, #ffffff);
  font-size: 18px;

  .bi {
    font-size: 15px;
  }

  @include md {
    right: 60px;
  }
}

// Logo + textos do acervo: position absolute, ancorado no canto inferior
// esquerdo. Isso garante que ele NÃO se mova quando o acordeão à direita
// muda de altura ao abrir/fechar seções — antes ele fazia parte do fluxo
// flex e "pulava" de posição a cada toggle.
.app-menu-overlay__brand {
  // left: 1rem;
  // bottom: 1.5rem;
  // max-width: calc(100% - 2rem);
  text-align: left;
  padding: 40px 32px;
  border-top: 1px solid var(--Cinza_C);

  @include md {
    border-top: none;
    padding: 0px;
    position: relative;
    top: 265px;
    height: fit-content;
    // left: 50px;
    // position: relative;
    // bottom: 200px;
    // max-width: 420px;
  }
}

.app-menu-overlay__brand-logo {
  height: 40px;
  width: auto;
  margin-bottom: 0.75rem;

  @include md {
    height: 56px;
  }
}

.app-menu-overlay__brand-text {
  color: var(--Cinza_E);
  font-size: .625rem;
  line-height: 16px;
  margin-bottom: 0.25rem;
  font-weight: 400;

  a {
    color: inherit;
    text-decoration: underline;
    font-size: .625rem;
    line-height: 16px;
    margin-bottom: 0.25rem;
    font-weight: 400;
  }
}

// Conteúdo principal: no mobile ocupa a largura toda (alinhado à
// esquerda); no desktop fica limitado e empurrado para a direita, como no
// mockup — sem centralizar verticalmente, para não saltar quando o
// acordeão expande.
.app-menu-overlay__content {
  // width: 100%;
  width: 240px;
  margin: 0 auto;
  margin-left: 84px;

  @include md {
    // max-width: 340px;
    // margin-left: auto;
    margin: initial;
    height: fit-content;
  }
}

.app-menu-overlay__section {
  margin-bottom: 2.5rem;
}

.app-menu-overlay__section-title {
  color: var(--Cinza_E);
  font-weight: 700;
  font-size: 20px;
  margin-bottom: 1rem;
}

.app-menu-overlay__collectives {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.app-menu-overlay__collective-avatar,
.app-menu-overlay__collective-add {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  text-decoration: none;
  overflow: hidden;
}

.app-menu-overlay__collective-avatar {
  background-color: var(--Cinza_E);
  color: var(--Branco, #ffffff);
  border: 2px solid var(--Cinza_C);
  font-size: 11px;
  font-weight: 700;
  line-height: 1.1;
  text-align: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

// Bolinha de perfil: mesma base visual do avatar de coletivo, com uma
// borda pra deixar claro que é "você" (e não mais um coletivo).
.app-menu-overlay__collective-profile {
  border: 2px solid var(--Cinza_C);
  background-color: var(--Branco);

  .bi {
    font-size: 20px;
    color: var(--Cinza_E);
  }
}

// Botão "+" -> rota de criar coletivo (antes era um link de texto
// "Criar coletivo" dentro do menu de perfil).
.app-menu-overlay__collective-add {
  background-color: var(--Laranja_E, #c1531b);
  color: var(--Branco, #ffffff);
  font-size: 22px;
}

.app-menu-overlay__accordion {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
}

.app-menu-overlay__accordion-item {
  width: 100%;
}

.app-menu-overlay__accordion-trigger {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4.1875rem;
  width: 100%;
  border: none;
  background: none;
  padding: 0;
  color: var(--Cinza_E);
  font-weight: 500;
  font-size: 20px;
  line-height: 150%;
  cursor: pointer;
  text-align: left;

  span {
    width: 91px;
  }

  &.is-open {
    font-weight: 700;
  }

  @include md {
    font-size: 28px;
  }
}

.app-menu-overlay__chevron {
  font-size: 16px;
  transition: transform 0.2s ease;

  &.is-open {
    transform: rotate(180deg);
  }
}

// Truque de grid-template-rows para animar a altura do painel sem medir
// altura via JS: 0fr fechado -> 1fr aberto, com overflow hidden no filho.
.app-menu-overlay__accordion-panel-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.25s ease;

  &.is-open {
    grid-template-rows: 1fr;
  }
}

.app-menu-overlay__accordion-panel {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  a {
    padding-top: 1rem;
  }
}

.app-menu-overlay__link {
  border: none;
  background: none;
  padding: 0;
  color: var(--Cinza_E);
  font-weight: 500;
  font-size: 20px;
  line-height: 150%;
  text-decoration: none;
  cursor: pointer;
  text-align: left;

  &.is-active {
    color: var(--Laranja_E);
  }

  @include md {
    font-size: 28px;
  }
}

// .app-menu-overlay__link--top {
//   font-weight: 500;
// }

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