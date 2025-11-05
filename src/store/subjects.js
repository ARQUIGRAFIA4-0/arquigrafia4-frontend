import { defineStore } from "pinia";
import axios from "../axios";

export const useSubjectsStore = defineStore("subjects", () => {
  async function getVRACSubjects() {
    try {
      const response = await axios.get("/api/vrac-subjects", {
        headers: {
          "Content-Type": "application/json"
        },
      });
      return response.data;
    } catch (error) {
      throw Error("Não foi possível obter os termos.");
    }
  }

  async function addVRACSubject(term) {
    if (!term || typeof term !== 'string' || !term.trim()) {
      throw Error("O termo é obrigatório e deve ser uma string não vazia.");
    }

    try {
      const response = await axios.post(
        "/api/vrac-subjects",
        { term, type: "otherTopic", vocab: "ARQUIGRAFIA" },
        {
          headers: {
            "Content-Type": "application/json"
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error("Não foi possível adicionar o termo. Tente novamente.");
    }
  }

  return {
    getVRACSubjects,
    addVRACSubject,
  };
});