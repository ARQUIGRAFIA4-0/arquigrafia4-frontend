<template>
  <div class="container-fluid p-2">
    <!-- Main Content Row -->
    <div class="row my-2 justify-content-center">
      <!-- Login Form Column (3 cols) -->
      <div class="col-12 col-md-3">
        <LoginForm />
      </div>

      <!-- Empty Column (1 col) -->
      <!-- <div class="d-none d-md-block col-md-1"></div> -->

      <!-- Image Gallery Column (8 cols) -->
      <div class="col-12 col-md-8">
        <Mosaic />
      </div>
    </div>
  </div>
</template>

<script>
import Mosaic from "../../components/Mosaic.vue";
import LoginForm from "../../components/LoginForm.vue";

export default {
  components: {
    Mosaic,
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

<style scoped>
/* Remove unused mosaic styles */

/* Optional: Add some padding or borders if needed */
.nav-tabs {
  border-bottom: 1px solid #dee2e6; /* Standard Bootstrap border */
}

.nav-link {
  color: #495057; /* Standard link color */
}

.nav-link.active {
  color: #0d6efd; /* Bootstrap primary blue */
  border-color: #dee2e6 #dee2e6 #fff;
}
</style>
