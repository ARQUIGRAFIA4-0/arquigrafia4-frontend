import { defineStore } from "pinia";
import axios from "../axios";

// Module-level cache: persists for the page session, deduplicates concurrent calls
let _subjectsCache = null;
let _subjectsFetchPromise = null;

export const useVracStore = defineStore("vrac", () => {
  async function getVRACSubjects() {
    if (_subjectsCache !== null) return _subjectsCache;
    if (_subjectsFetchPromise) return _subjectsFetchPromise;
    _subjectsFetchPromise = axios
      .get("/api/vrac-subjects?per_page=-1", {
        headers: { "Content-Type": "application/json" },
      })
      .then((response) => {
        _subjectsCache = response.data.data;
        _subjectsFetchPromise = null;
        return _subjectsCache;
      })
      .catch(() => {
        _subjectsFetchPromise = null;
        throw Error("Não foi possível obter os termos.");
      });
    return _subjectsFetchPromise;
  }

  async function addVRACSubject(term) {
    if (!term || typeof term !== 'string' || !term.trim()) {
      throw Error("O termo é obrigatório e deve ser uma string não vazia.");
    }

    try {
      const response = await axios.post(
        "/api/vrac-subjects",
        { term, type: "otherTopic", vocab: "Arquigrafia" },
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

  async function getVRACAgentRoles() {
    try {
      const response = await axios.get("/api/vrac-agent-roles?per_page=-1", {
        headers: { "Content-Type": "application/json" },
      });
      return response.data.data;
    } catch (error) {
      throw Error("Não foi possível obter os tipos de autor.");
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
    getVRACAgentRoles,
    getVRACWorks,
  };
});