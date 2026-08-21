<template>
  <div class="container-fluid authentication-container">
    <div class="row my-2 authentication-container__row">
      <!-- Formulário -->
      <div class="col-12 authentication-container__form">
        <LoginForm />
      </div>

      <!-- Gutter 1/12 só no desk ≥1440 (mesma lógica de /eu/imagens) -->
      <div
        class="authentication-container__gutter"
        aria-hidden="true"
      />

      <!-- Mosaico -->
      <div class="col-12 authentication-container__mosaic">
        <ViewMosaic />
      </div>
    </div>
  </div>
</template>

<script>
import ViewMosaic from "@/components/homepage/ViewMosaic.vue";
import LoginForm from "../../components/LoginForm.vue";

export default {
  components: {
    ViewMosaic,
    LoginForm,
  },
  methods: {
    saveToken(token) {
      const expirationTime = new Date();
      expirationTime.setHours(expirationTime.getHours() + 12); // Token valid for 12 hours
      const tokenData = {
        value: token,
        expiresAt: expirationTime.toISOString(),
      };
      localStorage.setItem("loginToken", JSON.stringify(tokenData));
    },
    getToken() {
      const tokenData = JSON.parse(localStorage.getItem("loginToken"));
      if (tokenData) {
        const now = new Date();
        if (new Date(tokenData.expiresAt) > now) {
          return tokenData.value;
        } else {
          localStorage.removeItem("loginToken"); // Remove expired token
        }
      }
      return null;
    },
  },
};
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;

$breakpoint-laptop: 768px;
$breakpoint-tablet-side: 1024px; // lado a lado só a partir daqui (evita encavalamento ~768)
$breakpoint-wide: 1440px; // mesmo limite do gutter em /eu/imagens

.authentication-container {
  width: 100%;
  padding: 0 1rem;
  box-sizing: border-box;

  @media (min-width: #{$breakpoint-laptop}) {
    padding: 8px 1.25rem;
  }

  @media (min-width: #{$breakpoint-tablet-side}) {
    padding: 8px 2rem;
  }

  @media (min-width: #{$breakpoint-wide}) {
    padding: 8px 50px;
  }
}

.authentication-container__row {
  --bs-gutter-x: 1.25rem;

  @media (min-width: #{$breakpoint-tablet-side}) {
    align-items: start;
  }

  @media (min-width: #{$breakpoint-wide}) {
    --bs-gutter-x: 0;
  }
}

/* <1024: empilhado (form em cima, mosaico embaixo) — evita aperto perto de 768 */
.authentication-container__form,
.authentication-container__mosaic {
  min-width: 0;
}

/* 1024–1439: 2 colunas, SEM gutter */
@media (min-width: #{$breakpoint-tablet-side}) and (max-width: 1439.98px) {
  .authentication-container__form {
    flex: 0 0 auto;
    width: 36%;
    max-width: 420px;
  }

  .authentication-container__mosaic {
    flex: 1 1 0;
    width: auto;
    min-width: 0;
  }
}

/* ≥1440: grid Figma 3 | 1 | 8 */
@media (min-width: #{$breakpoint-wide}) {
  .authentication-container__form {
    flex: 0 0 auto;
    width: 25%; /* 3/12 */
    max-width: none;
  }

  .authentication-container__mosaic {
    flex: 0 0 auto;
    width: 66.666667%; /* 8/12 */
  }
}

.authentication-container__gutter {
  display: none;
  min-width: 0;

  @media (min-width: #{$breakpoint-wide}) {
    display: block;
    flex: 0 0 auto;
    width: 8.333333%; /* 1/12 */
  }
}
</style>
