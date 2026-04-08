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
    

    return { createAlbum };
})