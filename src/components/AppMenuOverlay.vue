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
  { label: "ARQUIGRAFIA 4.0", to: "/about/project" },
  { label: "Membros", to: "/about/members" },
  { label: "Políticas", to: "/about/policies" },
  { label: "Vocabulário", to: "/about/vocabulary" },
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
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
@use "@/scss/variables" as *;

$breakpoint-md: 768px; 
$breakpoint-lg: 1000px; 
$breakpoint-xlg: 2000px;

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
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  inset: 0;
  z-index: 1029;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  background-color: var(--Branco, #ffffff);
  min-height: 100dvh;
  padding: clamp(11rem, 26vw, 11.25rem) clamp(1.25rem, 6vw, 3.75rem)
    clamp(2rem, 8vw, 4rem);
  gap: clamp(2rem, 8vw, 4rem);

  @include md {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    padding: clamp(2.5rem, 5vw, 4rem) clamp(2.5rem, 5vw, 6rem);
    gap: clamp(2rem, 4vw, 4rem);
  }

  @include lg {
    padding-inline: clamp(4rem, 8vw, 10rem);
  }
}

.app-menu-overlay__close {
  position: fixed;
  top: max(8rem, env(safe-area-inset-top) + 0.75rem);
  right: max(1.1rem, env(safe-area-inset-right) + 0.75rem);
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
    font-size: clamp(0.8rem, 3vw, 0.9375rem);
  }

  @include md {
    top: clamp(5.1rem, 3vw, 2.5rem);
    right: clamp(3rem, 3vw, 3.75rem);
  }
}

.app-menu-overlay__brand {
  order: 2;
  text-align: left;
  padding-top: clamp(1.5rem, 6vw, 2.5rem);
  border-top: 1px solid var(--Cinza_C);
  flex-shrink: 0;

  @include md {
    order: 0;
    border-top: none;
    padding: 0;
    align-self: flex-end;
    margin-bottom: clamp(0.5rem, 3vw, 2.5rem);
    max-width: 26rem;
  }

  @include lg {
     align-self: flex-end;
    margin-bottom: 10px;
  }

  @include xlg {
    align-self: auto;
    margin-top: 555px;
  }
}

.app-menu-overlay__brand-logo {
  height: clamp(2.25rem, 9vw, 3.5rem);
  width: auto;
  margin-bottom: 0.75rem;

  @include md {
    height: clamp(3.5rem, 6vw, 5rem);
  }
}

.app-menu-overlay__brand-text {
  color: var(--Cinza_E);
  font-size: clamp(0.625rem, 2.2vw, 0.75rem);
  line-height: 1.4;
  margin-bottom: 0.25rem;
  font-weight: 400;

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
  padding-left: clamp(1rem, 10vw, 5.25rem);
  box-sizing: border-box;
  flex-shrink: 0;

  @include md {
    order: 0;
    width: auto;
    max-width: 24rem;
    padding-left: 0;
    margin-top: 120px;
  }

  @include lg {
    margin-top: 75px;
  }
}

.app-menu-overlay__section {
  margin-bottom: clamp(1.75rem, 6vw, 2.5rem);
}

.app-menu-overlay__section-title {
  color: var(--Cinza_E);
  font-weight: 700;
  font-size: clamp(1.125rem, 4vw, 1.25rem);
  margin-bottom: 1rem;

   @include md {
    font-size: clamp(1rem, 1.125rem, 1.25rem);
  }

  @include lg {
    font-size: clamp(1.125rem, 4vw, 1.25rem);
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
  gap: clamp(1.25rem, 4vw, 1.5rem);
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
  justify-content: space-between;
  width: 100%;
  border: none;
  background: none;
  padding: 0;
  color: var(--Cinza_E);
  font-weight: 500;
  font-size: clamp(1.125rem, 4vw + 0.4rem, 1.25rem);
  line-height: 150%;
  cursor: pointer;
  text-align: left;

  &.is-open {
    font-weight: 700;
  }

  @include md {
    font-size: clamp(1rem, 2.4vw, 1.75rem);
  }

  @include lg {
    font-size: clamp(1.5rem, 2.4vw, 1.75rem);
  }
}

.app-menu-overlay__chevron {
  font-size: clamp(0.875rem, 3vw, 1rem);
  flex-shrink: 0;
  transition: transform 0.2s ease;

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
  font-size: clamp(1.125rem, 4vw + 0.4rem, 1.25rem);
  line-height: 150%;
  text-decoration: none;
  cursor: pointer;
  text-align: left;

  &.is-active {
    color: var(--Laranja_E);
  }

   @include md {
    font-size: clamp(1rem, 2.4vw, 1.75rem);
  }

  @include lg {
    font-size: clamp(1.5rem, 2.4vw, 1.75rem);
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