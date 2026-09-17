<script setup>
import { reactive, computed, watch, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";

const props = defineProps({
  show: { type: Boolean, default: false },
  isLoggedIn: { type: Boolean, default: false },
  avatarUrl: { type: String, default: null },
  photoCount: { type: [String, Number], default: "14030" },
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
  { label: "ARQUIGRAFIA", to: "/about/project" },
  { label: "Membros", to: "/about/members" },
  { label: "Políticas", to: "/about/policies" },
  // { label: "Vocabulário", to: "/about/vocabulary" },
];

const openSections = reactive({
  sobre: false,
});

function toggleSection(key) {
  openSections[key] = !openSections[key];
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

function getScrollbarWidth() {
  return window.innerWidth - document.documentElement.clientWidth;
}

function lockBodyScroll() {
  const scrollbarWidth = getScrollbarWidth();
  document.body.style.overflow = "hidden";
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }
}

function unlockBodyScroll() {
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
}
watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      lockBodyScroll();
      window.addEventListener("keydown", handleKeydown);
    } else {
      window.removeEventListener("keydown", handleKeydown);
    }
  }
);

onBeforeUnmount(() => {
  unlockBodyScroll();
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="menu-fade" @after-leave="unlockBodyScroll">
      <div
        v-if="show"
        class="app-menu-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        @click.self="close"
      >
        <div class="app-menu-overlay-wrapper">
          <button
            type="button"
            class="app-menu-overlay__close"
            aria-label="Fechar menu"
            @click="close"
          >
            <i class="bi bi-x-lg"></i>
          </button>

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

          <div class="app-menu-overlay__content" :class="{ 'user-not-logged': !isLoggedIn }">
            <template v-if="isLoggedIn">
              <!-- Perfil: avatar (vai pro "meu perfil") + botão de editar -->
              <section class="app-menu-overlay__section">
                <h2 class="app-menu-overlay__section-title">Perfil</h2>
                <div class="app-menu-overlay__collectives">
                  <router-link
                    to="/eu/imagens"
                    class="app-menu-overlay__collective-avatar"
                    title="Meu perfil"
                    @click="close"
                  >
                    <img v-if="avatarUrl" :src="avatarUrl" alt="Foto de perfil" />
                    <i v-else class="bi bi-person-fill"></i>
                  </router-link>
                  <router-link
                    to="/eu/editar"
                    class="app-menu-overlay__collective-add"
                    aria-label="Editar perfil"
                    title="Editar perfil"
                    @click="close"
                  >
                    <i class="bi bi-pencil-square"></i>
                  </router-link>
                </div>
              </section>

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
                  <!-- Bolinha "ver mais": só aparece se sobrar coletivo além
                      dos MAX_VISIBLE_COLLECTIVES já exibidos acima. -->
                  <router-link
                    v-if="collectives.length > MAX_VISIBLE_COLLECTIVES"
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
            </template>
            <router-link v-else to="/login" class="app-menu-overlay__link app-menu-overlay__accordion-item link-login" @click="close">
              Entrar
            </router-link>

            <!-- Acordeão -->
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

              <router-link to="/about/faq" class="app-menu-overlay__link app-menu-overlay__accordion-item" @click="close">
                FAQ
              </router-link>

              <button
                v-if="isLoggedIn"
                type="button"
                class="app-menu-overlay__link app-menu-overlay__link--top app-menu-overlay__link--button"
                @click="handleLogout"
              >
                Sair
              </button>
            </nav>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
@use "@/scss/variables" as *;

$breakpoint-md: 768px; 
$breakpoint-lg: 1000px; 
$breakpoint-xlg: 1400px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

@mixin lg {
  @media (min-width: #{$breakpoint-lg}) {
    @content;
  }
}

@mixin xlg {
  @media (min-width: #{$breakpoint-xlg}) {
    @content;
  }
}

.app-menu-overlay {
  position: fixed;
  // display: flex;
  // flex-direction: column;
  // justify-content: flex-start;
  // justify-content: space-between;
  // align-items: stretch;
  inset: 0;
  z-index: 1030;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  background-color: var(--Branco, #ffffff);
  min-height: 100dvh;
  padding-top: 248px;
  // gap: 24px;

  @include md {
    padding-top: 230px;
  //   height: 439px;

  //   flex-direction: row;
  //   align-items: flex-start;
  //   justify-content: space-between;
  //   padding: clamp(2.5rem, 5vw, 4rem) clamp(2.5rem, 5vw, 6rem);
  //   gap: clamp(2rem, 4vw, 4rem);
  }

  @include lg {
    display: flex;
    justify-content: center;
    padding-top: 55px;
  }

}

.app-menu-overlay-wrapper {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  gap: 24px;
  height: 100%;

  @include md {
    flex-direction: row;
    height: 370px;
    // align-items: center;
  }

  @include lg {
    width: 932px;
  }
}

.app-menu-overlay__close {
  position: fixed;
  // top: max(8rem, env(safe-area-inset-top) + 0.75rem);
  top: 122px;
  // right: max(1.1rem, env(safe-area-inset-right) + 0.75rem);
  right: 24px;
  width: clamp(1.75rem, 5vw, 2.25rem);
  height: clamp(1.75rem, 5vw, 2.25rem);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background-color: var(--Cinza_E, #222222);
  color: var(--Branco, #ffffff);
  font-size: 18px;
  z-index: 1;

  .bi {
    font-size: 16px;
  }

  @include md {
    top: 60px;
    right: 60px;
  }

  
}

.app-menu-overlay__brand {
  order: 2;
  text-align: left;
  // padding-top: clamp(1.5rem, 6vw, 2.5rem);
  gap: 4px;
  display: flex;
  flex-direction: column;
  padding: 40px 32px;
  border-top: 1px solid var(--Cinza_C);
  flex-shrink: 0;

  @include md {
    order: 0;
    border-top: none;
    padding: 0;
    padding-left: 44px;
    align-self: flex-end;
    // max-width: 26rem;
  }

  @include lg {
    padding-left: 0;
  }

}

.app-menu-overlay__brand-logo {
  width: 200px;
  margin-bottom: 20px;

  @include md {
    width: 250px;
  }

  @include lg {
    width: 350px;
  }
}

.app-menu-overlay__brand-text {
  color: var(--Cinza_E);
  font-size: clamp(0.625rem, 2.2vw, 0.75rem);
  line-height: 1.4;
  font-weight: 400;
  margin: 0;
  
  a {
    color: inherit;
    text-decoration: underline;
    font-size: inherit;
    line-height: inherit;
    font-weight: 400;
  }
}

.app-menu-overlay__content {
  order: 1;
  width: 100%;
  max-width: 21rem;
  // padding-left: clamp(1rem, 10vw, 5.25rem);
  padding: 0px 44px 0px 87px;
  box-sizing: border-box;
  flex-shrink: 0;

  @include md {
    order: 0;
    width: auto;
    max-width: 24rem;
    padding-left: 0;
    // margin-top: 10px;
  }
}

.user-not-logged {

  @include md {
    align-self: flex-end;
    height: 150px;
  }
}

.app-menu-overlay__section {
  // margin-bottom: clamp(1.75rem, 6vw, 2.5rem);
  margin-bottom: 32px;
  
  &:first-child {
    margin-bottom: 24px;
  }
}

.app-menu-overlay__section-title {
  color: var(--Cinza_E);
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 1rem;

   @include md {
    font-size: 20px;
  }
}

.app-menu-overlay__collectives {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: clamp(0.5rem, 2.5vw, 0.75rem);
}

.app-menu-overlay__collective-avatar,
.app-menu-overlay__collective-add {
  width: clamp(2.75rem, 10vw, 3.125rem);
  height: clamp(2.75rem, 10vw, 3.125rem);
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

.app-menu-overlay__collective-profile {
  border: 2px solid var(--Cinza_C);
  background-color: var(--Branco);

  .bi {
    font-size: 20px;
    color: var(--Cinza_E);
  }
}

.app-menu-overlay__collective-add {
  background-color: var(--Laranja_E, #c1531b);
  color: var(--Branco, #ffffff);
  font-size: 22px;
}

.app-menu-overlay__accordion {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  // gap: clamp(1.25rem, 4vw, 1.5rem);
  gap: 20px;
}

.app-menu-overlay__accordion-item {
  width: 100%;
  
}

.link-login {
  display: block;
  margin-bottom: 1.5rem;
}

.app-menu-overlay__accordion-trigger {
  display: flex;
  align-items: center;
  // justify-content: c;
  gap: 67px;
  width: 100%;
  border: none;
  background: none;
  padding: 0;
  color: var(--Cinza_E);
  font-weight: 500;
  // font-size: clamp(1.125rem, 4vw + 0.4rem, 1.25rem);
  font-size: 20px;
  line-height: 150%;
  cursor: pointer;
  text-align: left;
  transition: text-shadow 0.1s ease;

  &.is-open {
    // font-weight: 700;
    text-shadow: 0 0 0.65px currentColor, 0 0 0.65px currentColor;
  }

  @include md {
    font-size: 20px;
  }
  
  @include lg {
    
  }
}

.app-menu-overlay__chevron {
  font-size: 20px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
  color: var(--Cinza_E);

  &.is-open {
    transform: rotate(180deg);
  }
}

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
  gap: 20px;
  
  // a {
  //   padding-top: 1rem;
  // }
}

.app-menu-overlay__link {
  border: none;
  background: none;
  padding: 0;
  color: var(--Cinza_E);
  font-weight: 500;
  font-size: clamp(1.125rem, 4vw + 0.4rem, 1.25rem);
  line-height: 150%;
  text-decoration: none;
  cursor: pointer;
  text-align: left;

  &:first-child {
    padding-top: 20px;
  }

  &.is-active {
    color: var(--Laranja_E);
  }

  @include md {
    font-size: 20px;
  }
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.2s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
}
</style>