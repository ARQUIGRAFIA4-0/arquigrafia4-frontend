<template>
  <div class="container-fluid home-display p-2">
    <div class="row my-2">
      <div class="col-12">
        <h2 class="txt-white" style="text-shadow: 1px 1px black;">Bem-vinde</h2>
        <button class="btn btn-primary" @click="goToLogin">Entrar</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    goToLogin() {
      this.$router.push('/login')
    },
  },
}
</script>
