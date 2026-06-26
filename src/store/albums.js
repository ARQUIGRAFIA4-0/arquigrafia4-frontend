import { defineStore } from "pinia";
import axios from "../axios";

export const useAlbumsStore = defineStore("albums", () => {

    // Função para criar um álbum
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

    // Função para buscar os álbuns do usuário
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

    // Função para buscar os álbuns de um coletivo
    async function getCollectiveAlbums(authHeader, collectiveId) {
        try {
            const headers = { "Content-Type": "application/json" };
            if (authHeader) {
                headers.Authorization = authHeader;
            }
            const response = await axios.get(`/api/collectives/${collectiveId}/albums`, {
                headers,
            });
            return response.data;
        }
        catch (error) {
            throw new Error(
                error?.response?.data?.message || "Não foi possível buscar as coleções do coletivo."
            );
        }
    }

    // Função para deletar um álbum
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

    // Função para buscar os dados do álbum pelo ID
    async function getDataAlbumByAlbumId(authHeader, albumId) {
        try {
            const response = await axios.get(`/api/albums/${albumId}`, {
                headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader,
                },
            });
            return response.data;
        }
        catch (error) {
            throw new Error(
                error?.response?.data?.message || "Não foi possível buscar os dados do álbum."
            );
        }
    }

    // Atualiza título e descrição do álbum
    async function updateAlbum(authHeader, albumId, payload) {
        try {
            const response = await axios.put(`/api/albums/${albumId}`, payload, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: authHeader,
                },
            });

            return response.data;
        } catch (error) {
            throw new Error(
                error?.response?.data?.message || "Não foi possível atualizar a coleção."
            );
        }
    }

    // Busca os dados de uma coleção preservando o status HTTP da resposta.
    // Diferente de getDataAlbumByAlbumId, retorna { success, data, status, message }
    // para que views públicas possam distinguir 403 (sem acesso) de 404 (não encontrada).
    // O header de autorização é opcional (visitantes não autenticados).
    async function getAlbumDetail(authHeader, albumId) {
        try {
            const headers = { "Content-Type": "application/json" };
            if (authHeader) {
                headers.Authorization = authHeader;
            }
            const response = await axios.get(`/api/albums/${albumId}`, { headers });
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                status: error?.response?.status ?? null,
                message: error?.response?.data?.message || "Não foi possível buscar os dados da coleção.",
            };
        }
    }

    // Adicionar imagem ao álbum
    async function addImageToAlbum(authHeader, albumId, imageIds) {
        console.log("addImageToAlbum", authHeader, albumId, imageIds);
        try {
            // aceita string única ou array de strings
            const ids = Array.isArray(imageIds) ? imageIds : [imageIds];
        
            const payload = {
                images: ids.map((id) => ({ image_id: id })),
            };
        
            const response = await axios.post(
                `/api/albums/${albumId}/images`,
                payload,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: authHeader,
                    },
                }
            );
        
            return response.data;

        } catch (error) {
            throw new Error(
                error?.response?.data?.message || "Não foi possível adicionar a imagem ao álbum."
            );
        }
    }

    // Remover imagem do álbum
    async function removeImagesFromAlbum(authHeader, albumId, imageIds) {

        const ids = Array.isArray(imageIds) ? imageIds : [imageIds];

        try {

            const response = await axios.delete(`/api/albums/${albumId}/images`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: authHeader,
                },
                data: {
                    image_ids: ids,
                },
            });

            return response.data;

        } catch (error) {
          throw new Error(
            error?.response?.data?.message ||
              "Não foi possível remover as imagens da coleção."
          );

        }

    }

    // Obter tags dos álbuns
    async function getTagsByAlbumId(authHeader, albumId) {
        try {
            const response = await axios.get(`/api/albums/${albumId}/tags`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: authHeader,
                },
            });
            return response.data;
        }
        catch (error) {
            throw new Error(
                error?.response?.data?.message || "Não foi possível buscar as tags do álbum."
            );
        }
    }   

    // Sincroniza todas as imagens do álbum com nova ordem e/ou remoções
    async function syncImages(authHeader, albumId, images) {
        const payload = {
            images: images.map((img, index) => ({
                image_id: img.id,
                position: index + 1,
            })),
        };
        try {
            const response = await axios.put(`/api/albums/${albumId}/images`, payload, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: authHeader,
                },
            });
            return response.data;
        } catch (error) {
            throw new Error(
                error?.response?.data?.message || "Não foi possível sincronizar as imagens da coleção."
            );
        }
    }

    return { createAlbum, getUserAlbums, getCollectiveAlbums, deleteAlbum, getDataAlbumByAlbumId, updateAlbum, getAlbumDetail, addImageToAlbum, removeImagesFromAlbum, syncImages, getTagsByAlbumId };
})