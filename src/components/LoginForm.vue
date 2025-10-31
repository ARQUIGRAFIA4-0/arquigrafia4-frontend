<script setup>
import { storeToRefs } from "pinia";
import { useAuthStore } from "../store/auth";

const auth = useAuthStore();
const {
  isLoggedIn,
  loggedUser,
  isVerifying,
  isRegistering,
  isLoading,
  formData,
  pageTitle,
  loadingMessage,
  verificationDigits,
  digitRefs,
  isCodeComplete,
  showPassword,
  showConfirmPassword,
  isForgotPassword,
} = storeToRefs(auth);
const {
  handleLogin,
  handleRegister,
  toggleRegister,
  handleDigitInput,
  handleBackspace,
  focusPreviousDigit,
  focusNextDigit,
  handlePaste,
  verifyCode,
  resendCode,
  sendPasswordResetEmail,
} = auth;
</script>

<template>
  <div
    v-if="!isLoggedIn || (isLoggedIn && !loggedUser?.email_verified_at)"
    class="login-container"
  >
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
      <p class="text-muted mb-4">
        Digite o código de verificação enviado para seu email
      </p>
      <div class="verification-code mb-4">
        <template v-for="(digit, index) in 6" :key="index">
          <input
            v-model="verificationDigits[index]"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="1"
            class="form-control verification-input"
            :ref="
              (el) => {
                if (el) digitRefs[index] = el;
              }
            "
            @input="handleDigitInput($event, index)"
            @keydown.delete="handleBackspace($event, index)"
            @keydown.left="focusPreviousDigit(index)"
            @keydown.right="focusNextDigit(index)"
            @paste="handlePaste"
          />
        </template>
      </div>
      <div class="d-grid">
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="!isCodeComplete"
        >
          Verificar
        </button>
      </div>
      <p class="text-center mt-3">
        <small>
          Não recebeu o código?
          <a href="#" @click.prevent="resendCode" class="text-decoration-none"
            >Reenviar</a
          >
        </small>
      </p>
    </form>
    <!-- Password Reset Form -->
    <div v-else-if="isForgotPassword" class="form-floating mb-3">
      <input
        v-model="formData.email"
        type="email"
        class="form-control"
        id="floatingResetEmail"
        placeholder="nome@exemplo.com"
      />
      <label for="floatingResetEmail">Digite seu email</label>
      <div class="mt-3 d-flex gap-2">
        <button
          type="button"
          class="btn btn-secondary flex-grow-1"
          @click="isForgotPassword = false"
        >
          Voltar
        </button>
        <button
          type="button"
          class="btn btn-primary flex-grow-1"
          @click="sendPasswordResetEmail()"
        >
          Enviar
        </button>
      </div>
    </div>
    <!-- Registration/Login Form -->
    <form
      v-else
      @submit.prevent="isRegistering ? handleRegister() : handleLogin()"
    >
      <div v-if="isRegistering" class="form-floating mb-3">
        <div class="form-floating mb-3">
          <input
            v-model="formData.username"
            type="text"
            class="form-control"
            id="floatingUsername"
            placeholder="Nome de usuário"
          />
          <label for="floatingUsername">Nome de usuário</label>
        </div>
        <div class="form-floating mb-3">
          <input
            v-model="formData.email"
            type="email"
            class="form-control"
            id="floatingEmail"
            placeholder="nome@exemplo.com"
          />
          <label for="floatingEmail">Email</label>
        </div>
        <div class="form-floating mb-3">
          <input
            v-model="formData.confirmEmail"
            type="email"
            class="form-control"
            id="floatingConfirmEmail"
            placeholder="nome@exemplo.com"
          />
          <label for="floatingConfirmEmail">Confirme o email</label>
        </div>
        <div class="mb-3 form-floating">
          <input
            v-model="formData.password"
            :type="showPassword ? 'text' : 'password'"
            class="form-control"
            id="floatingPassword"
            placeholder="senha"
          />
          <label for="floatingPassword">Senha</label>
          <button
            type="button"
            class="btn btn-link position-absolute top-50 end-0 translate-middle-y pe-3"
            @click="showPassword = !showPassword"
          >
            <i class="bi" :class="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
          </button>
        </div>
        <div class="mb-3 form-floating">
          <input
            v-model="formData.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            class="form-control"
            id="floatingConfirmPassword"
            placeholder="Confirme a senha"
          />
          <label for="floatingConfirmPassword">Confirme a Senha</label>
          <button
            type="button"
            class="btn btn-link position-absolute top-50 end-0 translate-middle-y pe-3"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            <i
              class="bi"
              :class="showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'"
            ></i>
          </button>
        </div>
      </div>
      <div v-else class="mb-3 form-floating">
        <div class="form-floating mb-3">
          <input
            v-model="formData.email"
            type="email"
            class="form-control"
            id="floatingInput"
            placeholder="nome@exemplo.com"
          />
          <label for="floatingInput">Email</label>
        </div>
        <div class="form-floating mb-3">
          <input
            v-model="formData.password"
            :type="showPassword ? 'text' : 'password'"
            class="form-control"
            id="floatingPassword"
            placeholder="senha"
          />
          <label for="floatingPassword">Senha</label>
          <button
            type="button"
            class="btn btn-link position-absolute top-50 end-0 translate-middle-y pe-3"
            @click="showPassword = !showPassword"
          >
            <i class="bi" :class="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
          </button>
          <a
            href="#"
            class="text-muted text-decoration-none"
            @click.prevent="auth.isForgotPassword = true"
          >
            Esqueceu sua senha?
          </a>
        </div>
      </div>

      <div v-if="!isRegistering" class="mb-3 form-check text-start">
        <input
          v-model="formData.remember"
          type="checkbox"
          class="form-check-input"
          id="exampleCheck1"
        />
        <label class="form-check-label" for="exampleCheck1">Lembrar</label>
      </div>

      <div class="d-grid gap-2 d-md-flex">
        <button
          type="button"
          class="btn btn-outline-primary flex-grow-1"
          @click="toggleRegister"
        >
          {{ isRegistering ? "Já tenho conta" : "Criar conta" }}
        </button>
        <button type="submit" class="btn btn-primary flex-grow-1">
          {{ isRegistering ? "Registrar" : "Entrar" }}
        </button>
      </div>

      <div v-if="!isRegistering" class="d-flex align-items-center my-4">
        <hr class="flex-grow-1" />
        <span class="mx-3 text-muted">Ou</span>
        <hr class="flex-grow-1" />
      </div>

      <div v-if="!isRegistering" class="d-grid gap-2">
        <button
          type="button"
          class="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            width="20"
            height="20"
          />
          Continue com Google
        </button>
        <button
          type="button"
          class="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2"
        >
          <img
            src="https://orcid.org/sites/default/files/images/orcid_16x16.png"
            alt="ORCID"
            width="20"
            height="20"
          />
          Continue com ORCID
        </button>
      </div>
    </form>
  </div>

  <div v-else class="text-center">
    <h2>Login Realizado</h2>
    <p>{{ loggedUser?.name }}</p>
  </div>
</template>

<style scoped>
.login-container {
  background-color: #faf9f9;
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
  border-color: #aa4f28;
  box-shadow: none;
}

.verification-input::-webkit-outer-spin-button,
.verification-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
