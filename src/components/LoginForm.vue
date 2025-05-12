<template>
  <div v-if="!isLoggedIn" class="login-container">
    <h2 class="text-start mb-4">{{ isRegistering ? 'Crie sua conta' : 'Acesse seu perfil' }}</h2>
    <form @submit.prevent="isRegistering ? doRegister() : doLogin()">
      <div v-if="isRegistering" class="form-floating mb-3">
        <input v-model="registerForm.username" type="text" class="form-control" id="floatingUsername"
          placeholder="Nome de usuário">
        <label for="floatingUsername">Nome de usuário</label>
      </div>
      <div class="form-floating mb-3">
        <input v-model="formEmail" type="email" class="form-control" id="floatingInput" placeholder="nome@examplo.com">
        <label for="floatingInput">Email</label>
      </div>
      <div class="mb-3 form-floating">
        <input v-model="formPassword" type="password" class="form-control" id="floatingPassword" placeholder="senha">
        <label for="floatingPassword">Senha</label>
        <template v-if="!isRegistering">
          <a href="#" class="text-muted">Esqueceu sua senha?</a>
        </template>
      </div>
      <div v-if="isRegistering" class="mb-3 form-floating">
        <input v-model="registerForm.confirmPassword" type="password" class="form-control" id="floatingConfirmPassword"
          placeholder="Confirme a senha">
        <label for="floatingConfirmPassword">Confirme a Senha</label>
      </div>

      <div v-if="!isRegistering" class="mb-3 form-check text-start">
        <input v-model="loginForm.remember" type="checkbox" class="form-check-input" id="exampleCheck1">
        <label class="form-check-label" for="exampleCheck1">Lembrar</label>
      </div>

      <div class="d-grid gap-2 d-md-flex">
        <button type="button" class="btn btn-outline-primary flex-grow-1" @click="toggleRegister">
          {{ isRegistering ? 'Já tenho conta' : 'Criar conta' }}
        </button>
        <button type="submit" class="btn btn-primary flex-grow-1">
          {{ isRegistering ? 'Registrar' : 'Entrar' }}
        </button>
      </div>

      <div v-if="!isRegistering" class="d-flex align-items-center my-4">
        <hr class="flex-grow-1">
        <span class="mx-3 text-muted">Ou</span>
        <hr class="flex-grow-1">
      </div>

      <div v-if="!isRegistering" class="d-grid gap-2">
        <button type="button" class="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2">
          <img src="https://www.google.com/favicon.ico" alt="Google" width="20" height="20">
          Continue com Google
        </button>
        <button type="button" class="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2">
          <img src="https://orcid.org/sites/default/files/images/orcid_16x16.png" alt="ORCID" width="20" height="20">
          Continue com ORCID
        </button>
      </div>
    </form>
  </div>

  <div v-else class="text-center">
    <h2>Login Realizado</h2>
    <p>{{ loggedUser.name }}</p>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { authStore } from '../store/auth'
import axios from 'axios';

export default {
  name: 'LoginForm',
  data() {
    return {
      isRegistering: false,
      loginForm: {
        email: "",
        password: "",
        remember: false,
      },
      registerForm: {
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      },
    }
  },
  methods: {
    toggleRegister() {
      this.isRegistering = !this.isRegistering;
      // Clear the forms when toggling
      this.loginForm = { email: "", password: "", remember: false };
      this.registerForm = { username: "", email: "", password: "" };
    },
    async doLogin() {
      if (!this.loginForm.email || !this.loginForm.password) {
        alert('Preencha todos os campos!');
        return;
      }
      await this.getAccessToken(this.loginForm);
      if (this.isLoggedIn) {
        await this.getLoggedUser();
      }
    },
    async doRegister() {
      if (!this.registerForm.username || !this.registerForm.email || !this.registerForm.password) {
        alert('Preencha todos os campos!');
        return;
      }
      if (this.registerForm.username.length > 50) {
        alert('O nome de usuário deve ter no máximo 50 caracteres.');
        return;
      }
      if (!this.validEmail(this.registerForm.email)) {
        alert('Insira um email válido.');
        return;
      }
      if (this.registerForm.password.length < 8) {
        alert('A senha deve ter no mínimo 8 caracteres.');
        return;
      }
      if (this.registerForm.password !== this.registerForm.confirmPassword) {
        alert('As senhas não coincidem.');
        return;
      }

      try {
        const response = await axios.post('http://localhost:80/api/users', {
          name: this.registerForm.username,
          email: this.registerForm.email,
          password: this.registerForm.password,
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        alert('Registrado com sucesso! Agora você pode fazer login.');
        this.toggleRegister();
      } catch (error) {
        console.error(error);
        alert('Erro ao registrar. Tente novamente.');
      }
    },
    validEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    },
    ...mapActions(authStore, ['getAccessToken', 'getLoggedUser'])
  },
  computed: {
    ...mapState(authStore, ['accessToken', 'isLoggedIn', 'loggedUser']),

    formEmail: {
      get() {
        return this.isRegistering ? this.registerForm.email : this.loginForm.email;
      },
      set(value) {
        if (this.isRegistering) {
          this.registerForm.email = value;
        } else {
          this.loginForm.email = value;
        }
      }
    },

    formPassword: {
      get() {
        return this.isRegistering ? this.registerForm.password : this.loginForm.password;
      },
      set(value) {
        if (this.isRegistering) {
          this.registerForm.password = value;
        } else {
          this.loginForm.password = value;
        }
      }
    },
  },
}
</script>

<style scoped>
.login-container {
  background-color: #FAF9F9;
  border-radius: 16px;
  padding: 2rem;
  font-weight: 500;
  /* max-width: 340px; */
}
</style>
