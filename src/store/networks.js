import { defineStore } from "pinia";
import axios from "../axios";

export const useNetworksStore = defineStore("networks", () => {
  async function searchNetworks(queryParams) {
    try {
      const response = await axios.get("/api/actors", {
        params: queryParams,
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      throw new Error("Não foi possível buscar as redes.");
    }
  }

  return { searchNetworks };

});