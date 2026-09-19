<template>
  <nav class="about-menu">
    <ul class="about-menu__list">
      <li class="about-menu__item" :class="{ 'about-menu__item--active': $route.name === 'about-project' }">
        <router-link :to="{ name: 'about-project' }" class="about-menu__link">
          <span class="about-menu__text">Sobre</span>
          <i class="bi bi-arrow-right about-menu__icon"></i>
        </router-link>
      </li>
      <li class="about-menu__item" :class="{ 'about-menu__item--active': $route.name === 'about-members' }">
        <router-link :to="{ name: 'about-members' }" class="about-menu__link">
          <span class="about-menu__text">Membros</span>
          <i class="bi bi-arrow-right about-menu__icon"></i>
        </router-link>
      </li>
      <li class="about-menu__item" :class="{ 'about-menu__item--active': $route.name === 'about-policies' }">
        <router-link :to="{ name: 'about-policies' }" class="about-menu__link">
          <span class="about-menu__text">Políticas da plataforma</span>
          <i class="bi bi-arrow-right about-menu__icon"></i>
        </router-link>
      </li>
      <li class="about-menu__item" :class="{ 'about-menu__item--active': $route.name === 'about-faq' }">
        <router-link :to="{ name: 'about-faq' }" class="about-menu__link">
          <span class="about-menu__text">FAQ</span>
          <i class="bi bi-arrow-right about-menu__icon"></i>
        </router-link>
      </li>
      <li class="about-menu__item" :class="{ 'about-menu__item--active': $route.name === 'about-open-source' }">
        <router-link :to="{ name: 'about-open-source' }" class="about-menu__link">
          <span class="about-menu__text">Código aberto</span>
          <i class="bi bi-arrow-right about-menu__icon"></i>
        </router-link>
      </li>
      <li class="about-menu__item" :class="{ 'about-menu__item--active': $route.name === 'about-vocabulary' }">
        <router-link :to="{ name: 'about-vocabulary' }" class="about-menu__link">
          <span class="about-menu__text">Vocabulário</span>
          <i class="bi bi-arrow-right about-menu__icon"></i>
        </router-link>
      </li>
    </ul>
  </nav>
  <nav class="about-menu-mobile" aria-label="Navegação da seção Sobre">
    <div class="about-menu-mobile__scroller" ref="scrollerRef">
      <router-link
        v-for="item in items"
        :key="item.name"
        :to="{ name: item.name }"
        class="about-menu-mobile__tab"
        :class="{ 'about-menu-mobile__tab--active': $route.name === item.name }"
      >
        {{ item.label }}
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import { useRoute } from "vue-router";

defineOptions({ name: "AboutMenu" });

const items = [
  { name: "about-project", label: "Sobre" },
  { name: "about-members", label: "Membros" },
  { name: "about-policies", label: "Políticas da plataforma" },
  { name: "about-faq", label: "FAQ" },
  { name: "about-open-source", label: "Código aberto" },
  { name: "about-vocabulary", label: "Vocabulário" },
];

const route = useRoute();
const scrollerRef = ref(null);

function scrollActiveTabIntoView() {
  const activeTab = scrollerRef.value?.querySelector(
    ".about-menu-mobile__tab--active"
  );
  activeTab?.scrollIntoView({ inline: "center", block: "nearest" });
}

onMounted(scrollActiveTabIntoView);

watch(
  () => route.name,
  () => nextTick(scrollActiveTabIntoView)
);
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.about-menu {
  position: sticky;
  top: 32px;
  z-index: 100;
  background-color: #ffffff;
  padding-right: 1rem;

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  &__item {
    margin: 0;
    border-bottom: 0.5px solid var(--Cinza_C, #A6A6A6);
    padding: 0;

    &:hover {

      .about-menu__text,
      .about-menu__icon {
        color: var(--Laranja_E, #FF7F00);
      }
    }

    &--active {

      .about-menu__text,
      .about-menu__icon {
        color: var(--Laranja_E, #FF7F00);
      }
    }
  }

  &__link {
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-decoration: none;
    color: inherit;
    width: 100%;
    padding: 12px 4px 12px 4px;
  }

  &__text {
    @include md {
      font-weight: 700;
      font-style: Bold;
      font-size: 14px;
      line-height: 125%;
      letter-spacing: 0%;
    }
  }

  &__icon {
    color: var(--Cinza_M, #636262);

    @include md {
      font-weight: 700;
      font-style: Bold;
      font-size: 14px;
      line-height: 125%;
      letter-spacing: 0%;
    }
  }

  display: none;

  @include md {
    display: block;
  }

}

.about-menu-mobile {
  margin-bottom: 32px;

  @include md {
    display: none;
  }
}
 
.about-menu-mobile__scroller {
  display: flex;
  align-items: center;
  gap: 24px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  @include md {
    padding: 0 16px;
  }
 

  scrollbar-width: none; 
 
  &::-webkit-scrollbar {
    display: none;
  }
}
 
.about-menu-mobile__tab {
  flex-shrink: 0;
  white-space: nowrap;
  padding: 12px 2px;
  border-bottom: 2px solid transparent;
  color: var(--Cinza_E, #222222);
  font-weight: 500;
  font-size: 14px;
  line-height: 125%;
  text-decoration: none;
  transition: text-shadow 0.1s ease;
 
  &--active {
    color: var(--Laranja_E, #ff7f00);
    text-shadow: 0 0 0.65px currentColor, 0 0 0.65px currentColor;
    border-bottom-color: var(--Laranja_E, #ff7f00);
  }
}
</style>