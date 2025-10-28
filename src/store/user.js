import { defineStore } from "pinia";
import axios from "../axios";

export const useUsersStore = defineStore("users", () => {
  async function getUser(authHeader, userId) {
    try {
      const response = await axios.get(`/api/users/${userId}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
      });
      return response.data.user;
    } catch (error) {
      throw new Error("Não foi possível buscar o usuário.");
    }
  }

  return { getUser };
});