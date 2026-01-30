<template>
  <div class="container-fluid authentication-container">
    <!-- Main Content Row -->
    <div class="row my-2 justify-content-center">
      <!-- Login Form Column (3 cols) -->
      <div class="col-12 col-md-3">
        <LoginForm />
      </div>

      <!-- Empty Column (1 col) -->
      <div class="d-none d-md-block col-md-1"></div>

      <!-- Image Gallery Column (8 cols) -->
      <div class="col-12 col-md-8">
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
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.authentication-container {
  @include md {
    padding: 8px 50px;
  }
}
</style>
