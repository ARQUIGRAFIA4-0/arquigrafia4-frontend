import { ref } from "vue";
import { defineStore } from "pinia";
import { useAuthStore } from "./auth";
import { api } from "@/services/api";

const NAME_MAX_LENGTH = 255;
const DESCRIPTION_MAX_LENGTH = 500;

export const useCollectivesStore = defineStore("collectives", () => {
  const isLoading = ref(false);

  /**
   * Cria um novo coletivo.
   * @param {{ name: string, description: string }} collectiveData
   * @returns {{ success: boolean, message?: string, data?: object }}
   */
  async function createCollective({ name, description }) {
    const trimmedName = (name ?? "").trim();
    const trimmedDescription = (description ?? "").trim();

    if (!trimmedName) {
      return { success: false, message: "O nome do coletivo é obrigatório." };
    }
    if (trimmedName.length > NAME_MAX_LENGTH) {
      return { success: false, message: `O nome deve ter no máximo ${NAME_MAX_LENGTH} caracteres.` };
    }
    if (trimmedDescription.length > DESCRIPTION_MAX_LENGTH) {
      return { success: false, message: `A descrição deve ter no máximo ${DESCRIPTION_MAX_LENGTH} caracteres.` };
    }

    const authStore = useAuthStore();
    if (!authStore.isLoggedIn) {
      return { success: false, message: "Você precisa estar logado para criar um coletivo." };
    }

    const formData = new FormData();
    formData.append("name", trimmedName);
    if (trimmedDescription) {
      formData.append("description", trimmedDescription);
    }

    isLoading.value = true;
    try {
      const data = await api.createCollective(authStore.authHeader, formData);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      isLoading.value = false;
    }
  }

  return { isLoading, createCollective };
});
