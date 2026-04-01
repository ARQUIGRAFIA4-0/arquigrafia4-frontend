<script setup>
import { storeToRefs } from "pinia";
import { useAuthStore } from "../store/auth";
import { useRouter } from "vue-router";

import { ref, onMounted, watchEffect } from "vue";

const router = useRouter();

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
  isSettingNewPassword,
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
  changePassword,
  resetForm,
  resetPasswordFlow,
} = auth;

// Alert system
const alertMessage = ref("");
const alertType = ref("");
const showAlert = ref(false);

function displayAlert(message, type = "error") {
  alertMessage.value = message;
  alertType.value = type;
  showAlert.value = true;
}

function closeAlert() {
  showAlert.value = false;
  alertMessage.value = "";
  alertType.value = "";
}

async function handleLoginWithAlert() {
  closeAlert();
  const result = await handleLogin();
  if (result && !result.success) {
    displayAlert(result.message, "error");
  }
}

async function handleRegisterWithAlert() {
  closeAlert();
  const result = await handleRegister();
  if (result && !result.success) {
    displayAlert(result.message, "error");
  }
}

async function verifyCodeWithAlert() {
  closeAlert();
  const result = await verifyCode();
  if (result && result.message) {
    displayAlert(result.message, result.success ? "success" : "error");
  }
}

async function resendCodeWithAlert() {
  closeAlert();
  const result = await resendCode();
  if (result) {
    displayAlert(result.message, result.success ? "success" : "error");
  }
}

async function sendPasswordResetEmailWithAlert() {
  closeAlert();
  const result = await sendPasswordResetEmail();
  if (result) {
    displayAlert(result.message, result.success ? "success" : "error");
  }
}

async function changePasswordWithAlert() {
  closeAlert();
  const result = await changePassword();
  if (result) {
    displayAlert(result.message, result.success ? "success" : "error");
  }
}

// Redireciona para a home se o usuário já estiver logado e verificado
watchEffect(() => {
  if (isLoggedIn.value && loggedUser.value?.email_verified_at) {
    router.push("/");
  }
});

// Reseta para a view padrão de login ao montar o componente
onMounted(() => {
  isVerifying.value = false;
  isRegistering.value = false;
  isForgotPassword.value = false;
  isSettingNewPassword.value = false;
  showPassword.value = false;
  showConfirmPassword.value = false;
  closeAlert();
});

</script>

<template>
  <div
    v-if="!isLoggedIn || (isLoggedIn && !loggedUser?.email_verified_at)"
    class="login-container"
  >
    <!-- Loading -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
      <p class="mt-3 text-primary">{{ loadingMessage }}</p>
    </div>

    <h2 class="form-title text-start mb-4">{{ pageTitle }}</h2>

    <!-- Alerta -->
    <div v-if="showAlert" 
         :class="['alert', 'fs-6', alertType === 'success' ? 'bg-positivo-e' : 'bg-negativo-e', 'text-white', 'mb-3', 'd-flex', 'align-items-center', 'justify-content-between', 'auth-alert']"
         role="alert">
      <div class="d-flex align-items-center gap-2">
        <i :class="alertType === 'success' ? 'bi bi-check-all' : 'bi bi-exclamation-triangle-fill'"></i>
        <span>{{ alertMessage }}</span>
      </div>
      <button
        type="button"
        class="btn-close text-white"
        @click="closeAlert"
        aria-label="Close"
      ></button>
    </div>

    <!-- Formulário de Verificação de Email -->
    <form v-if="isVerifying" @submit.prevent="verifyCodeWithAlert">
      <label class="input-label mb-1">Código</label>
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
        <small class="form-text text-muted d-block mt-1 form-input-subtitle">
          Insira aqui o código recebido no seu e-mail e valide seu acesso.
        </small>
      </div>
      <div class="d-flex gap-2 mb-3">
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm flex-fill"
          :disabled="isLoading"
          @click="resetPasswordFlow(); isRegistering = false; closeAlert();"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm flex-fill"
          :disabled="isLoading"
          @click.prevent="resendCodeWithAlert"
        >
          Reenviar
        </button>
      </div>
      <div class="d-grid mb-4">
        <button
          type="submit"
          class="btn btn-primary btn-sm"
          :disabled="!isCodeComplete || isLoading"
        >
          Validar código
        </button>
      </div>
      <div
        class="alert alert-dark bg-off-white alert-light border border-dark border-start-3 email-valitation-alert"
        role="alert"
      >
        <i class="bi bi-info-square-fill text-preto"></i>
        Caso não tenha recebido o código, verifique sua caixa de spam ou solicite o reenvio.
      </div>
    </form>
    <!-- Formulário de Redefinição de Senha -->
    <div v-else-if="isForgotPassword" class="form-floating mb-3">
      <div class="forgot-password-form-box">
        <label class="input-label mb-1">Qual o e-mail cadastrado?</label>
        <input
          v-model="formData.email"
          type="email"
          class="form-control"
          placeholder="seu-email@email.com.br"
          autocomplete="email"
        />
        <small class="form-text text-muted d-block mt-1 form-input-subtitle">Para garantir a segurança de sua conta, enviaremos um link de recuperação de senha para seu e-mail.</small>
      </div>
      <div class="d-grid d-md-flex gap-2 form-btn-row">
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm form-btn-half"
          :disabled="isLoading"
          @click="isForgotPassword = false; resetForm(); closeAlert();"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="btn btn-primary btn-sm form-btn-half"
          :disabled="isLoading"
          @click="sendPasswordResetEmailWithAlert()"
        >
          Redefinir senha
        </button>
      </div>
    </div>
    <!-- Formulário de Nova Senha (após validação de código de redefinição) -->
    <form v-else-if="isSettingNewPassword" @submit.prevent="changePasswordWithAlert">
      <div class="mb-3">
        <label class="input-label mb-1">Nova senha</label>
        <div class="position-relative">
          <input
            v-model="formData.password"
            :type="showPassword ? 'text' : 'password'"
            class="form-control"
            placeholder="Nova senha"
            autocomplete="new-password"
          />
          <button
            type="button"
            class="btn btn-link position-absolute top-50 end-0 translate-middle-y pe-3"
            @click="showPassword = !showPassword"
            tabindex="-1"
          >
            <i class="bi" :class="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
          </button>
        </div>
        <small class="form-text text-muted d-block mt-1 form-input-subtitle">Crie uma senha com pelo menos 8 dígitos.</small>
      </div>
      <div class="mb-4">
        <label class="input-label mb-1">Repita a nova senha</label>
        <div class="position-relative">
          <input
            v-model="formData.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            class="form-control"
            placeholder="Confirme a nova senha"
            autocomplete="new-password"
          />
          <button
            type="button"
            class="btn btn-link position-absolute top-50 end-0 translate-middle-y pe-3"
            @click="showConfirmPassword = !showConfirmPassword"
            tabindex="-1"
          >
            <i class="bi" :class="showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
          </button>
        </div>
        <small class="form-text text-muted d-block mt-1 form-input-subtitle">Repita a senha para confirmar.</small>
      </div>
      <div class="form-btn-row">
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm form-btn-half"
          :disabled="isLoading"
          @click="resetPasswordFlow(); closeAlert();"
        >
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary btn-sm form-btn-half" :disabled="isLoading">
          Salvar nova senha
        </button>
      </div>
    </form>
    <!-- Formulário de Registro/Login -->
    <form
      v-else
      @submit.prevent="isRegistering ? handleRegisterWithAlert() : handleLoginWithAlert()"
    >
      <div v-if="isRegistering" class="form-floating signup-form-box">
        <div class="mb-3">
          <label class="input-label mb-1">Como podemos te chamar?</label>
          <input
            v-model="formData.username"
            type="text"
            class="form-control"
            placeholder="Seu nome"
            autocomplete="username"
          />
          <small class="form-text text-muted d-block mt-1 form-input-subtitle">Esse nome será visível por outras pessoas dentro do ARQUIGRAFIA.</small>
        </div>
        <div class="mb-3">
          <label class="input-label mb-1">E-mail</label>
          <input
            v-model="formData.email"
            type="email"
            class="form-control"
            placeholder="exemplo@email.com.br"
            autocomplete="email"
          />
          <small class="form-text text-muted d-block mt-1 form-input-subtitle">Enviaremos um código de confirmação, por isso prefira seu melhor e-mail.</small>
        </div>
        <div class="mb-3">
          <label class="input-label mb-1">Senha</label>
          <div class="position-relative">
            <input
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-control"
              placeholder="Senha"
              autocomplete="new-password"
            />
            <button
              type="button"
              class="btn btn-link position-absolute top-50 end-0 translate-middle-y pe-3"
              @click="showPassword = !showPassword"
              tabindex="-1"
            >
              <i class="bi" :class="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
            </button>
          </div>
          <small class="form-text text-muted d-block mt-1 form-input-subtitle">Crie uma senha com pelo menos 8 dígitos.</small>
        </div>
        <div class="mb-3">
          <label class="input-label mb-1">Repita a senha</label>
          <div class="position-relative">
            <input
              v-model="formData.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              class="form-control"
              placeholder="Confirme sua senha"
              autocomplete="new-password"
            />
            <button
              type="button"
              class="btn btn-link position-absolute top-50 end-0 translate-middle-y pe-3"
              @click="showConfirmPassword = !showConfirmPassword"
              tabindex="-1"
            >
              <i class="bi" :class="showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
            </button>
          </div>
          <small class="form-text text-muted d-block mt-1 form-input-subtitle">Repita a senha para confirmar.</small>
        </div>
      </div>
      <div v-else class="login-form-box">
        <div class="mb-3">
          <label class="input-label mb-1">E-mail cadastrado</label>
          <input
            v-model="formData.email"
            type="email"
            class="form-control"
            placeholder="E-mail cadastrado"
            autocomplete="email"
          />
        </div>
        <div class="mb-3">
          <label class="input-label mb-1">Senha</label>
          <div class="position-relative">
            <input
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-control"
              placeholder="Senha"
              autocomplete="current-password"
            />
            <button
              type="button"
              class="btn btn-link position-absolute top-50 end-0 translate-middle-y pe-3"
              @click="showPassword = !showPassword"
              tabindex="-1"
            >
              <i class="bi" :class="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
            </button>
          </div>
        </div>
        <a
            href="#"
            class="forgot-password-btn"
            @click.prevent="resetForm(); auth.isForgotPassword = true; closeAlert();"
          >
            Esqueci minha senha
        </a>
      </div>

      <div class="form-btn-row">
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm form-btn-half"
          :disabled="isLoading"
          @click="toggleRegister"
        >
          {{ isRegistering ? "Já tenho conta" : "Criar conta" }}
        </button>
        <button type="submit" class="btn btn-primary btn-sm form-btn-half" :disabled="isLoading">
          {{ isRegistering ? "Registrar" : "Entrar" }}
        </button>
      </div>
    </form>
  </div>

  <div v-else class="text-center">
    <h2>Login Realizado</h2>
    <p>{{ loggedUser?.name }}</p>
  </div>
</template>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.login-container {
  background-color: #faf9f9;
  border-radius: 16px;
  padding: 2rem;
  font-weight: 500;
  position: sticky;
  top: 32px;
  z-index: 100;
}

.login-form-box {
  margin-bottom: 40px;
}

.signup-form-box {
  margin-bottom: 50px;
}

.forgot-password-form-box {
  margin-bottom: 40px;
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

.form-title {
  font-weight: 500;
  font-size: 20px;
  line-height: 150%;
  letter-spacing: 0%;

  @include md {
    font-size: 30px;
  }
}

.input-label {
  font-weight: 500;
  font-size: 16px;
  line-height: 120%;
  letter-spacing: 0%;
  padding-bottom: 10px;

  @include md {
    font-size: 20px;
  }
}

.form-input-subtitle {
  padding-left: 4px;
  padding-right: 4px;
  color: var(--Cinza_M);
  font-weight: 400;
  font-style: Italic;
  font-size: 12px;
  line-height: 125%;
  letter-spacing: 0%;
}

.forgot-password-btn {
  color: var(--Azul_E);
  font-weight: 400;
  font-size: 14px;
  line-height: 125%;
  letter-spacing: 0%;
  text-decoration: underline;
  text-decoration-style: solid;
  text-decoration-thickness: 0%;
  text-decoration-skip-ink: auto;
}

.form-btn-row {
  display: flex;
  gap: 0.5rem;
}

.form-btn-half {
  flex: 1 1 50%;
  min-width: 0;
}

.verification-code {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;

  @include md {
    gap: 0.1rem;
    justify-content: space-between;
  }
}

.verification-input {
  width: calc(100% / 6 - 0.5rem);
  max-width: 3rem;
  height: 3rem;
  text-align: center;
  font-size: 1.5rem;
  border-radius: 0.5rem;
  border: 2px solid #dee2e6;
  transition: border-color 0.2s;
  appearance: textfield;
  -webkit-appearance: textfield;
  -moz-appearance: textfield;

  @include md {
    width: calc(100% / 6 - 0.1rem);
    font-size: 1rem;
  }
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

.auth-alert {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1050;
  width: auto;
  max-width: 90%;
  height: auto;
}

.email-valitation-alert {
  width: auto;
  max-width: 100%;
  height: auto;
  font-weight: 400;
  font-style: 9pt;
  font-size: 14px;
  line-height: 150%;
  letter-spacing: 0%;
}
</style>
