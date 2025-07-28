<template>
  <div v-if="!isLoggedIn" class="login-container">
    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
      <p class="mt-3 text-primary">{{ loadingMessage }}</p>
    </div>

    <h2 class="text-start mb-4">{{ pageTitle }}</h2>

    <!-- Email Verification Form -->
    <form v-if="isVerifying" @submit.prevent="verifyCode">
      <p class="text-muted mb-4">Digite o código de verificação enviado para seu email</p>
      <div class="verification-code mb-4">
        <template v-for="(digit, index) in 6" :key="index">
          <input
            v-model="verificationDigits[index]"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="1"
            class="form-control verification-input"
            :ref="el => { if (el) digitRefs[index] = el }"
            @input="handleDigitInput($event, index)"
            @keydown.delete="handleBackspace($event, index)"
            @keydown.left="focusPreviousDigit(index)"
            @keydown.right="focusNextDigit(index)"
            @paste="handlePaste"
          >
        </template>
      </div>
      <div class="d-grid">
        <button type="submit" class="btn btn-primary" :disabled="!isCodeComplete">
          Verificar
        </button>
      </div>
      <p class="text-center mt-3">
        <small>
          Não recebeu o código? 
          <a href="#" @click.prevent="resendCode" class="text-decoration-none">Reenviar</a>
        </small>
      </p>
    </form>

    <!-- Registration/Login Form -->
    <form v-else @submit.prevent="isRegistering ? doRegister() : doLogin()">
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

export default {
  name: 'LoginForm',
  data() {
    return {
      isRegistering: false,
      isLoading: false,
      loadingMessage: '',
      verificationDigits: Array(6).fill(''),
      digitRefs: Array(6).fill(null),
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
      this.$pinia._s.get('auth').isVerifying = false;
      // Clear the forms when toggling
      this.loginForm = { email: "", password: "", remember: false };
      this.registerForm = { username: "", email: "", password: "" };
      this.verificationDigits = ['', '', '', '', '', ''];
    },

    async doLogin() {
      if (!this.loginForm.email || !this.loginForm.password) {
        alert('Preencha todos os campos!');
        return;
      }
      await this.getAccessToken(this.loginForm);
      if (this.isLoggedIn) {
        await this.getLoggedUser();
        // Check if user is verified
        if (this.loggedUser && !this.loggedUser.email_verified_at) {
          // Not verified: send code and show code input
          await this.sendVerificationEmail(this.loginForm.email);
          // Optionally, log out the user in the store
          this.$pinia._s.get('auth').isLoggedIn = false;
          this.$pinia._s.get('auth').loggedUser = null;
          alert('Sua conta ainda não foi verificada. Digite o código enviado para seu email.');
          return;
        }
        // If verified, proceed as normal (redirect handled elsewhere)
      }
    },

    async sendVerificationEmail(email) {
      try {
        await this.sendVerificationEmail(email);
      } catch (error) {
        console.error('Error sending verification email:', error);
        alert('Erro ao enviar email de verificação. Tente novamente.');
      }
    },

    async verifyCode() {
      const code = this.verificationDigits.join('');
      try {
        await this.verifyAccount(this.verificationEmail, code);
        // After successful verification, show success and reset
        alert('Conta verificada com sucesso! Agora você pode fazer login.');
        this.toggleRegister();
      } catch (error) {
        console.error('Error verifying code:', error);
        alert('Código inválido. Tente novamente.');
      }
    },

    async resendCode() {
      await this.sendVerificationEmail(this.verificationEmail);
      alert('Um novo código foi enviado para seu email.');
    },

    handleDigitInput(event, index) {
      const digit = event.target.value;
      // Only allow numbers
      if (!/^\d*$/.test(digit)) {
        this.verificationDigits[index] = '';
        return;
      }
      // Auto-advance to next input
      if (digit && index < 5 && this.digitRefs[index + 1]) {
        this.digitRefs[index + 1].focus();
      }
    },

    handleBackspace(event, index) {
      if (!this.verificationDigits[index] && index > 0 && this.digitRefs[index - 1]) {
        this.digitRefs[index - 1].focus();
      }
    },

    focusPreviousDigit(index) {
      if (index > 0 && this.digitRefs[index - 1]) {
        this.digitRefs[index - 1].focus();
      }
    },

    focusNextDigit(index) {
      if (index < 5 && this.digitRefs[index + 1]) {
        this.digitRefs[index + 1].focus();
      }
    },

    handlePaste(event) {
      event.preventDefault();
      const pastedText = event.clipboardData.getData('text');
      const numbers = pastedText.match(/\d/g);
      if (numbers) {
        numbers.slice(0, 6).forEach((number, index) => {
          if (index < 6) {
            this.verificationDigits[index] = number;
          }
        });
      }
    },

    async doRegister() {
      // Validate all fields are filled
      if (!this.registerForm.username || !this.registerForm.email || !this.registerForm.password) {
        alert('Preencha todos os campos!');
        return;
      }
      // Validate username length
      if (this.registerForm.username.length > 50) {
        alert('O nome de usuário deve ter no máximo 50 caracteres.');
        return;
      }
      // Validate email format
      if (!this.validEmail(this.registerForm.email)) {
        alert('Insira um email válido.');
        return;
      }
      // Validate password length
      if (this.registerForm.password.length < 8) {
        alert('A senha deve ter no mínimo 8 caracteres.');
        return;
      }
      // Validate password confirmation
      if (this.registerForm.password !== this.registerForm.confirmPassword) {
        alert('As senhas não coincidem.');
        return;
      }
      
      this.isLoading = true;
      
      try {
        this.loadingMessage = 'Criando sua conta...';
        await this.registerUser({
          name: this.registerForm.username,
          email: this.registerForm.email,
          password: this.registerForm.password,
        });
        
        this.loadingMessage = 'Enviando código de verificação...';
        await this.sendVerificationEmail(this.registerForm.email);
      } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
          alert(error.response.data.message);
        } else {
          alert('Erro ao registrar. Tente novamente.');
        }
      } finally {
        this.isLoading = false;
        this.loadingMessage = '';
      }
    },

    validEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    },
    ...mapActions(authStore, [
      'getAccessToken',
      'getLoggedUser',
      'registerUser',
      'sendVerificationEmail',
      'verifyAccount'
    ])
  },
  computed: {
    ...mapState(authStore, [
      'accessToken',
      'isLoggedIn',
      'loggedUser',
      'isVerifying',
      'verificationEmail'
    ]),

    pageTitle() {
      if (this.isVerifying) return 'Verificação de Email';
      return this.isRegistering ? 'Crie sua conta' : 'Acesse seu perfil';
    },

    isCodeComplete() {
      return this.verificationDigits.every(digit => digit.length === 1);
    },

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
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(250, 249, 249, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  z-index: 10;
}

.verification-code {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.verification-input {
  width: 3rem;
  height: 3rem;
  text-align: center;
  font-size: 1.5rem;
  border-radius: 0.5rem;
  border: 2px solid #dee2e6;
  transition: border-color 0.2s;
  appearance: textfield;
  -webkit-appearance: textfield;
  -moz-appearance: textfield;
}

.verification-input:focus {
  border-color: #AA4F28;
  box-shadow: none;
}

.verification-input::-webkit-outer-spin-button,
.verification-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
