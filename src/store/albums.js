import { defineStore } from "pinia";
import axios from "../axios";

export const useAlbumsStore = defineStore("albums", () => {

    async function createAlbum(authHeader, payload) {
        try {
            const response = await axios.post("/api/albums/", payload, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: authHeader,
                },
            });

            return response.data;

        } catch (error) {
            throw new Error(
                error?.response?.data?.message || "Não foi possível criar o álbum."
            );
        }
    }

    async function getUserAlbums(authHeader, userId) {
        try {
            const response = await axios.get(`/api/users/${userId}/albums`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: authHeader,
                },
            });
            return response.data;
        }
        catch (error) {
            throw new Error(
                error?.response?.data?.message || "Não foi possível buscar os álbuns."
            );
        }
    }

    async function deleteAlbum(authHeader, albumId) {
        try {
            const response = await axios.delete(`/api/albums/${albumId}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: authHeader,
                },
            });
            return response.data;
        }
        catch (error) {
            throw new Error(
                error?.response?.data?.message || "Não foi possível excluir o álbum."
            );
        }
    }

    return { createAlbum, getUserAlbums, deleteAlbum };
})