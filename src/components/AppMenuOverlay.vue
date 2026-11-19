<script setup>
import { computed, watch, onBeforeUnmount } from "vue";

const props = defineProps({
  show: { type: Boolean, default: false },
  isLoggedIn: { type: Boolean, default: false },
  avatarUrl: { type: String, default: null },
  photoCount: { type: [String, Number], default: "14030" },
  collectives: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:show", "logout"]);

// Mostra no máximo 2 coletivos aqui; para ver o resto, o usuário passa
// pela bolinha de perfil (ela leva pro perfil, que lista todos).
const MAX_VISIBLE_COLLECTIVES = 2;
const visibleCollectives = computed(() =>
  props.collectives.slice(0, MAX_VISIBLE_COLLECTIVES)
);

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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                fill="currentColor"
                d="M32 16C32 20.2435 30.3143 24.3131 27.3137 27.3137C24.3131 30.3143 20.2435 32 16 32C11.7565 32 7.68687 30.3143 4.68629 27.3137C1.68571 24.3131 0 20.2435 0 16C0 11.7565 1.68571 7.68687 4.68629 4.68629C7.68687 1.68571 11.7565 0 16 0C20.2435 0 24.3131 1.68571 27.3137 4.68629C30.3143 7.68687 32 11.7565 32 16V16ZM10.708 9.292C10.5202 9.10423 10.2656 8.99874 10 8.99874C9.73445 8.99874 9.47977 9.10423 9.292 9.292C9.10423 9.47977 8.99874 9.73445 8.99874 10C8.99874 10.2656 9.10423 10.5202 9.292 10.708L14.586 16L9.292 21.292C9.19902 21.385 9.12527 21.4954 9.07495 21.6168C9.02464 21.7383 8.99874 21.8685 8.99874 22C8.99874 22.1315 9.02464 22.2617 9.07495 22.3832C9.12527 22.5046 9.19902 22.615 9.292 22.708C9.47977 22.8958 9.73445 23.0013 10 23.0013C10.1315 23.0013 10.2617 22.9754 10.3832 22.925C10.5046 22.8747 10.615 22.801 10.708 22.708L16 17.414L21.292 22.708C21.385 22.801 21.4954 22.8747 21.6168 22.925C21.7383 22.9754 21.8685 23.0013 22 23.0013C22.1315 23.0013 22.2617 22.9754 22.3832 22.925C22.5046 22.8747 22.615 22.801 22.708 22.708C22.801 22.615 22.8747 22.5046 22.925 22.3832C22.9754 22.2617 23.0013 22.1315 23.0013 22C23.0013 21.8685 22.9754 21.7383 22.925 21.6168C22.8747 21.4954 22.801 21.385 22.708 21.292L17.414 16L22.708 10.708C22.801 10.615 22.8747 10.5046 22.925 10.3832C22.9754 10.2617 23.0013 10.1315 23.0013 10C23.0013 9.86851 22.9754 9.73831 22.925 9.61683C22.8747 9.49535 22.801 9.38498 22.708 9.292C22.615 9.19902 22.5046 9.12527 22.3832 9.07495C22.2617 9.02464 22.1315 8.99874 22 8.99874C21.8685 8.99874 21.7383 9.02464 21.6168 9.07495C21.4954 9.12527 21.385 9.19902 21.292 9.292L16 14.586L10.708 9.292Z"
              />
            </svg>
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
              Login
            </router-link>

            <!-- Navegação -->
            <nav class="app-menu-overlay__accordion">
              <router-link to="/about/project" class="app-menu-overlay__link app-menu-overlay__accordion-item" @click="close">
                Sobre
              </router-link>

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
  inset: 0;
  z-index: 1030;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  background-color: var(--Branco, #ffffff);
  min-height: 100dvh;


  @include md {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  @include lg {
    display: flex;
    justify-content: center;;
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
    height: auto;
    gap: 40px;
  }

  @include lg {
    width: 932px;
  }
}

.app-menu-overlay__close {
  position: fixed;
  top: 24px;
  right: 24px;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  // Zera os estilos nativos de <button> (o Safari aplica padding próprio)
  appearance: none;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--Cinza_E, #2f2f2f);
  line-height: 0;
  z-index: 1;

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  @include md {
    top: 60px;
    right: 60px;
  }

  
}

.app-menu-overlay__brand {
  order: 2;
  text-align: left;
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
    align-self: flex-end;
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
    width: 460px;
  }
}

.app-menu-overlay__brand-text {
  color: var(--Cinza_E);
  font-size: 12px;
  line-height: 115%;
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
  padding: 213px 32px;
  box-sizing: border-box;
  flex-shrink: 0;

  @include md {
    order: 0;
    width: auto;
    max-width: 24rem;
    padding: 0;
  }
}

.user-not-logged {

  @include md {
    align-self: flex-end;
    width: 236px;
  }
}

.app-menu-overlay__section {
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
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  text-decoration: none;
  overflow: hidden;

  .bi {
    line-height: 100%;
    font-size: 16px;
  }
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
  gap: 20px;
}

.app-menu-overlay__accordion-item {
  width: 100%;
  
}

.link-login {
  display: block;
  margin-bottom: 1.5rem;
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
    font-size: 30px;
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