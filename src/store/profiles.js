import { defineStore } from "pinia";
import axios from "../axios";

export const useProfilesStore = defineStore("profiles", () => {
  async function getPublicProfileById(userId) {
    try {
      const response = await axios.get(`/api/profiles/by-user-id/${userId}`, {
        headers: {
          "Content-Type": "application/json"
        },
      });
      return response.data;
    }
    catch (error) {
      throw Error("Não foi possível buscar o perfil.");
    }
  }

  async function getProfileById(authHeader, userId) {
    try {
      const response = await axios.get(`/api/profiles/by-user-id/${userId}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
      });
      return response.data;
    }
    catch (error) {
      throw Error("Não foi possível buscar o perfil.");
    }
  }

  return {
    getPublicProfileById,
    getProfileById
  };
});
