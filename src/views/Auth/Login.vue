<template>
  <div class="container-fluid p-2">
    <div class="row my-2">
      <div v-if="!deuCerto" class="col-md-6 px-3 text-center">
        <h2>Login</h2>
        <!-- <form> -->
          <div class="form-floating mb-3">
            <input v-model="loginForm.email" type="email" class="form-control" id="floatingInput" placeholder="name@example.com">
            <label for="floatingInput">Email</label>
          </div>
          <div class="mb-3 form-floating">
            <input v-model="loginForm.password" type="password" class="form-control" id="floatingPassword" placeholder="Password">
            <label for="floatingPassword">Password</label>
          </div>
          <div class="mb-3 form-check text-start">
            <input v-model="loginForm.email" type="checkbox" class="form-check-input" id="exampleCheck1">
            <label class="form-check-label" for="exampleCheck1">Lembrar</label>
          </div>
          <button type="button" class="btn btn-primary" @click="doLogin">Entrar</button>
        <!-- </form> -->
      </div>
      <div v-else class="col-md-6 px-3 text-center">
        <h2>Login Realizado</h2>
        <p>{{ loggedUser.name }}</p>
      </div>
      <div class="col-md-6 home-display">
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { authStore } from '../../store/auth'
// import axios from '../../axios/index';

export default {
  data() {
    return {
      retorno: '',
      loginForm: {
        email: "",
        password: "",
        remember: false,
      },
    }
  },
  methods: {
    async doLogin() {
      if (!this.loginForm.email || !this.loginForm.password) {
        alert('preencha!');
        return;
      }
      await this.getAccessToken(this.loginForm);
      if (this.deuCerto) {
        await this.getLoggedUser();
      }
      
    },
    ...mapActions(authStore, ['getAccessToken', 'getLoggedUser'])
  },
  computed: {
    ...mapState(authStore, ['accessToken', 'deuCerto', 'loggedUser'])
  },
}
</script>
