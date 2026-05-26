import { defineStore } from "pinia";
import axios from "../axios";

export const useVracStore = defineStore("vrac", () => {
  async function getVRACSubjects() {
    try {
      const response = await axios.get("/api/vrac-subjects?per_page=-1", {
        headers: {
          "Content-Type": "application/json"
        },
      });
      return response.data.data;
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
      return response.data.data;
    } catch (error) {
      throw new Error("Não foi possível adicionar o termo. Tente novamente.");
    }
  }

  async function getVRACContributorNames() {
    try {
      const response = await axios.get("/api/vrac-contributor-names?per_page=-1", {
        headers: {
          "Content-Type": "application/json"
        },
      });
      return response.data.data;
    } catch (error) {
      throw Error("Não foi possível obter os nomes de contribuidores.");
    }
  }

  async function addVRACContributorName(name) {
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw Error("O nome é obrigatório e deve ser uma string não vazia.");
    }

    try {
      const response = await axios.post(
        "/api/vrac-contributor-names",
        { name, type: "personal" },
        {
          headers: {
            "Content-Type": "application/json"
          },
        }
      );
      return response.data.name;
    } catch (error) {
      throw new Error("Não foi possível adicionar o nome. Tente novamente.");
    }
  }

  async function getVRACWorks() {
    try {
      const response = await axios.get("/api/vrac-works?per_page=-1", {
        headers: {
          "Content-Type": "application/json"
        },
      });
      return response.data.data;
    } catch (error) {
      throw Error("Não foi possível obter as obras.");
    }
  }

  return {
    getVRACSubjects,
    addVRACSubject,
    getVRACContributorNames,
    addVRACContributorName,
    getVRACWorks,
  };
});