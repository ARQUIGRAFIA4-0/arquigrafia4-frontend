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

  /**
   * Busca os dados de um coletivo pelo ID.
   * @param {string} id - UUID do coletivo
   * @returns {{ success: boolean, message?: string, data?: object }}
   */
  async function getCollective(id) {
    isLoading.value = true;
    try {
      const data = await api.getCollective(id);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Envia uma solicitação de entrada no coletivo.
   * @param {string} id - UUID do coletivo
   * @returns {{ success: boolean, message?: string, alreadyRequested?: boolean }}
   */
  async function requestJoin(id) {
    const authStore = useAuthStore();
    if (!authStore.isLoggedIn) {
      return { success: false, message: "Você precisa estar logado para solicitar entrada." };
    }
    try {
      await api.requestJoinCollective(authStore.authHeader, id);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Remove o próprio usuário do coletivo.
   * @param {string} collectiveId - UUID do coletivo
   * @returns {{ success: boolean, message?: string, isLastAdmin?: boolean }}
   */
  async function leaveCollective(collectiveId) {
    const authStore = useAuthStore();
    if (!authStore.isLoggedIn) {
      return { success: false, message: "Você precisa estar logado para realizar esta ação." };
    }
    try {
      await api.leaveCollective(authStore.authHeader, collectiveId, authStore.loggedUser.id);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        isLastAdmin: error.status === 422,
      };
    }
  }

  /**
   * Atualiza os dados de um coletivo.
   * @param {string} id - UUID do coletivo
   * @param {FormData} formData - Dados do formulário
   * @returns {{ success: boolean, message?: string, data?: object }}
   */
  async function updateCollective(id, formData) {
    const authStore = useAuthStore();
    if (!authStore.isLoggedIn) {
      return { success: false, message: "Você precisa estar logado para realizar esta ação." };
    }
    isLoading.value = true;
    try {
      const data = await api.updateCollective(authStore.authHeader, id, formData);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Remove um membro do coletivo (ação de admin).
   * @param {string} collectiveId
   * @param {string} userId
   * @returns {{ success: boolean, data?: object, message?: string }}
   */
  async function removeMember(collectiveId, userId) {
    const authStore = useAuthStore();
    if (!authStore.isLoggedIn) {
      return { success: false, message: "Você precisa estar logado para realizar esta ação." };
    }
    try {
      const data = await api.removeMember(authStore.authHeader, collectiveId, userId);
      return { success: true, data };
    } catch (error) {
      if (error.status === 404) {
        return { success: false, notFound: true, message: error.message };
      }
      return { success: false, message: error.message };
    }
  }

  /**
   * Promove um membro para admin do coletivo.
   * @param {string} collectiveId
   * @param {string} userId
   * @returns {{ success: boolean, data?: object, message?: string }}
   */
  async function promoteMemberToAdmin(collectiveId, userId) {
    const authStore = useAuthStore();
    if (!authStore.isLoggedIn) {
      return { success: false, message: "Você precisa estar logado para realizar esta ação." };
    }
    try {
      const data = await api.promoteMemberToAdmin(authStore.authHeader, collectiveId, userId);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Atualiza o papel (role) de um membro no coletivo.
   * @param {string} collectiveId
   * @param {string} userId
   * @param {"admin"|"member"} role
   * @returns {{ success: boolean, message?: string }}
   */
  async function updateMemberRole(collectiveId, userId, role) {
    const authStore = useAuthStore();
    if (!authStore.isLoggedIn) {
      return { success: false, message: "Você precisa estar logado para realizar esta ação." };
    }
    try {
      await api.updateMemberRole(authStore.authHeader, collectiveId, userId, role);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Busca as solicitações de entrada pendentes de um coletivo.
   */
  async function getJoinRequests(collectiveId) {
    const authStore = useAuthStore();
    if (!authStore.isLoggedIn) {
      return { success: false, message: "Você precisa estar logado para realizar esta ação." };
    }
    try {
      const data = await api.getJoinRequests(authStore.authHeader, collectiveId);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Aprova ou recusa uma solicitação de entrada no coletivo.
   * @param {"approve"|"reject"} action
   */
  async function handleJoinRequest(collectiveId, userId, action) {
    const authStore = useAuthStore();
    if (!authStore.isLoggedIn) {
      return { success: false, message: "Você precisa estar logado para realizar esta ação." };
    }
    try {
      const result = await api.handleJoinRequest(authStore.authHeader, collectiveId, userId, action);
      return { success: true, alreadyProcessed: result.alreadyProcessed };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  return {
    isLoading,
    createCollective,
    getCollective,
    requestJoin,
    leaveCollective,
    updateCollective,
    removeMember,
    promoteMemberToAdmin,
    updateMemberRole,
    getJoinRequests,
    handleJoinRequest,
  };
});
