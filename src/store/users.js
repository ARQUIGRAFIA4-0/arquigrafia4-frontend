import { defineStore } from "pinia";
import axios from "../axios";

export const useUsersStore = defineStore("users", () => {
  async function getUser(userId) {
    try {
      const response = await axios.get(`/api/users/${userId}`, {
        headers: {
          "Content-Type": "application/json"
        },
      });
      return response.data.user;
    } catch (error) {
      throw new Error("Não foi possível buscar o usuário.");
    }
  }

  async function updateUser(authHeader, userId, newUserData) {
    try {
      const response = await axios.put(`/api/users/${userId}`, newUserData, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error("Não foi possível atualizar o usuário.");
    }
  }

  return { getUser, updateUser };
});