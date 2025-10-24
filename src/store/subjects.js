import { defineStore } from "pinia";
import axios from "../axios";

export const useSubjectsStore = defineStore("subjects", () => {
  async function getVRACSubjects(authHeader) {
    try {
      const response = await axios.get("/api/vrac-subjects", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
      });
      return response.data;
    } catch (error) {
      throw Error("Não foi possível obter os termos.");
    }
  }

  return {
    getVRACSubjects
  };
});