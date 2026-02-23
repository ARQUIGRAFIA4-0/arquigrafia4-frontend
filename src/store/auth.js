import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { defineStore } from "pinia";
import axios from "../axios";

export const useAuthStore = defineStore("auth", () => {
  // State
  const router = useRouter();
  const userItem = localStorage.getItem("loggedUser");
  const loggedUser = ref(userItem ? JSON.parse(userItem) : null);
  const tokenType = ref(localStorage.getItem("tokenType") || "");
  const accessToken = ref(localStorage.getItem("accessToken") || "");
  const refreshToken = ref(localStorage.getItem("refreshToken") || "");
  const isVerifying = ref(false);
  const isRegistering = ref(false);
  const isLoading = ref(false);
  const isForgotPassword = ref(false);
  const showPassword = ref(false);
  const showConfirmPassword = ref(false);
  const verificationEmail = ref("");
  const initialFormState = {
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    remember: false,
  };
  const formData = ref({ ...initialFormState });
  const loadingMessage = ref("");
  const verificationDigits = ref(Array(6).fill(""));
  const digitRefs = ref(Array(6).fill(null));

  // Getters
  const isLoggedIn = computed(() => !!accessToken.value);
  const authHeader = computed(() => "Bearer " + accessToken.value);
  const pageTitle = computed(() => {
    if (isVerifying.value) return "Valide seu e-mail";
    if (isForgotPassword.value) return "Recuperar senha";
    return isRegistering.value ? "Crie sua conta" : "Acesse seu perfil";
  });
  const isCodeComplete = computed(() => {
    return verificationDigits.value.every((digit) => digit.length === 1);
  });

  // Actions
  function resetForm() {
    formData.value = { ...initialFormState };
  }
  async function handleLogin() {
    if (!formData.value.email || !formData.value.password) {
      return { success: false, message: "Preencha todos os campos!" };
    }

    try {
      const success = await getAccessToken({
        email: formData.value.email,
        password: formData.value.password,
      });

      if (!success) {
        return { success: false, message: "Email ou senha incorretos." };
      }

      await getLoggedUser();

      // Check verification status
      if (loggedUser.value && !loggedUser.value.email_verified_at) {
        isVerifying.value = true;
        await sendVerificationEmail(formData.value.email);
        return { success: true };
      }

      // If we get here, user is logged in and verified
      router.push("/");
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Erro ao fazer login. Tente novamente." };
    }
  }
  async function handleRegister() {
    // Validate all fields are filled
    if (
      !formData.value.username ||
      !formData.value.email ||
      !formData.value.password ||
      !formData.value.confirmPassword
    ) {
      return { success: false, message: "Preencha todos os campos!" };
    }
    // Validate username length
    if (formData.value.username.length > 50) {
      return { success: false, message: "O nome de usuário deve ter no máximo 50 caracteres." };
    }
    // Validate email format
    if (!validEmail(formData.value.email)) {
      return { success: false, message: "Insira um email válido." };
    }
    // Validate password length
    if (formData.value.password.length < 8) {
      return { success: false, message: "A senha deve ter no mínimo 8 caracteres." };
    }
    // Validate passwords match
    if (formData.value.password !== formData.value.confirmPassword) {
      return { success: false, message: "As senhas não coincidem." };
    }
    try {
      await registerUser({
        name: formData.value.username,
        email: formData.value.email,
        password: formData.value.password,
      });

      await sendVerificationEmail(formData.value.email);
      return { success: true };
    } catch (error) {
      if (error.response?.data?.message) {
        return { success: false, message: error.response.data.message };
      } else {
        return { success: false, message: "Erro ao registrar. Tente novamente." };
      }
    }
  }
  async function toggleRegister() {
    isRegistering.value = !isRegistering.value;
    isVerifying.value = false;
    showPassword.value = false;
    showConfirmPassword.value = false;
    resetForm();
    verificationDigits.value = Array(6).fill("");
  }
  async function getAccessToken(formData) {
    const sendData = {
      grant_type: import.meta.env.VITE_GRANT_TYPE,
      client_id: import.meta.env.VITE_CLIENT_ID,
      client_secret: import.meta.env.VITE_CLIENT_SECRET,
      username: formData.email,
      password: formData.password,
      scope: "*",
    };

    try {
      const response = await axios.post("/oauth/token", sendData);
      tokenType.value = response.data.token_type;
      accessToken.value = response.data.access_token;
      refreshToken.value = response.data.refresh_token;

      localStorage.setItem("tokenType", tokenType.value);
      localStorage.setItem("accessToken", accessToken.value);
      localStorage.setItem("refreshToken", refreshToken.value);
      return true;
    } catch (error) {
      console.error("Error fetching access token:", error);
      tokenType.value = "";
      accessToken.value = "";
      refreshToken.value = "";
      localStorage.removeItem("tokenType");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      return false; // 💡 Good practice: return failure status
    }
  }
  async function getLoggedUser() {
    if (!accessToken.value) {
      console.error("Access token is missing");
      return;
    }

    try {
      const response = await axios.get("/api/me", {
        headers: {
          Authorization: authHeader.value,
        },
      });
      loggedUser.value = response.data.user;

      // Save to localStorage
      localStorage.setItem("loggedUser", JSON.stringify(loggedUser.value));
    } catch (error) {
      console.error("Error fetching logged user:", error);
    }
  }
  async function logout() {
    try {
      if (accessToken.value) {
        await axios.post(
          "/api/logout",
          {},
          {
            headers: {
              Authorization: authHeader.value,
            },
          },
        );
      }
    } catch (error) {
      console.error("Error revoking token:", error);
    }

    // Clear state and localStorage
    loggedUser.value = null;
    tokenType.value = "";
    accessToken.value = "";
    refreshToken.value = "";
    isVerifying.value = false;
    verificationEmail.value = "";

    localStorage.removeItem("loggedUser");
    localStorage.removeItem("tokenType");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
  async function registerUser(userData) {
    try {
      await axios.post("/api/users", userData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return true;
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    }
  }
  async function sendVerificationEmail() {
    isLoading.value = true;
    loadingMessage.value = "Enviando código de verificação...";

    try {
      await axios.post("/api/account-verification-email", {
        email: formData.value.email,
      });
      isVerifying.value = true;
      // verificationEmail.value = email;
      return true;
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw error;
    } finally {
      isLoading.value = false;
      loadingMessage.value = "";
    }
  }
  async function sendPasswordResetEmail() {
    if (!formData.value.email) {
      return { success: false, message: "Por favor, preencha o campo de email." };
    }

    isLoading.value = true;
    loadingMessage.value = "Enviando email de recuperação...";

    try {
      await axios.post("/api/forgot-password-email", {
        email: formData.value.email,
      });
      isForgotPassword.value = false;
      isVerifying.value = true;
      return { success: true, message: "Um email com instruções foi enviado para você." };
    } catch (error) {
      console.error("Error sending reset email:", error);
      return { success: false, message: "Erro ao enviar email. Tente novamente." };
    } finally {
      isLoading.value = false;
      loadingMessage.value = "";
    }
  }
  async function verifyAccount(email, code) {
    try {
      await axios.post("/api/verify-account", { email, code });
      return true;
    } catch (error) {
      console.error("Error verifying account:", error);
      throw error;
    }
  }
  function handleDigitInput(event, index) {
    const digit = event.target.value;
    // Only allow numbers
    if (!/^\d*$/.test(digit)) {
      verificationDigits.value[index] = "";
      return;
    }
    // Auto-advance to next input
    if (digit && index < 5 && digitRefs.value[index + 1]) {
      digitRefs.value[index + 1].focus();
    }
  }
  function handleBackspace(event, index) {
    if (
      !verificationDigits.value[index] &&
      index > 0 &&
      digitRefs.value[index - 1]
    ) {
      digitRefs.value[index - 1].focus();
    }
  }
  function focusPreviousDigit(index) {
    if (index > 0 && digitRefs.value[index - 1]) {
      digitRefs.value[index - 1].focus();
    }
  }
  function focusNextDigit(index) {
    if (index < 5 && digitRefs.value[index + 1]) {
      digitRefs.value[index + 1].focus();
    }
  }
  function handlePaste(event) {
    event.preventDefault();
    const pastedText = event.clipboardData.getData("text");
    const numbers = pastedText.match(/\d/g);
    if (numbers) {
      numbers.slice(0, 6).forEach((number, index) => {
        if (index < 6) {
          verificationDigits.value[index] = number;
        }
      });
    }
  }
  function validEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  async function resendCode() {
    if (!validEmail(formData.value.email)) {
      return { success: false, message: "Insira um email válido antes de reenviar o código." };
    }

    try {
      await sendVerificationEmail(formData.value.email);
      return { success: true, message: "Um novo código foi enviado para seu email." };
    } catch (error) {
      console.error("Error resending verification code:", error);
      return { success: false, message: "Erro ao reenviar o código. Tente novamente." };
    }
  }
  async function verifyCode() {
    const code = verificationDigits.value.join("");
    try {
      await verifyAccount(formData.value.email, code);

      // Get access token with stored credentials
      const success = await getAccessToken({
        email: formData.value.email,
        password: formData.value.password,
      });

      if (success) {
        await getLoggedUser(); // Now we have the token, get user data

        if (loggedUser.value?.email_verified_at) {
          router.push("/");
          return { success: true, message: "Email verificado com sucesso!" };
        }
      }
      return { success: false, message: "Erro na verificação. Tente novamente." };
    } catch (error) {
      console.error("Error verifying code:", error);
      return { success: false, message: "Código inválido. Tente novamente." };
    }
  }
  return {
    formData,
    loggedUser,
    tokenType,
    accessToken,
    refreshToken,
    isVerifying,
    isRegistering,
    isLoading,
    loadingMessage,
    verificationDigits,
    digitRefs,
    verificationEmail,
    isLoggedIn,
    authHeader,
    pageTitle,
    showPassword,
    showConfirmPassword,
    isCodeComplete,
    isForgotPassword,
    toggleRegister,
    handleLogin,
    handleRegister,
    getAccessToken,
    getLoggedUser,
    logout,
    registerUser,
    sendVerificationEmail,
    sendPasswordResetEmail,
    verifyAccount,
    handleDigitInput,
    handleBackspace,
    focusPreviousDigit,
    focusNextDigit,
    handlePaste,
    validEmail,
    resendCode,
    verifyCode,
  };
});
