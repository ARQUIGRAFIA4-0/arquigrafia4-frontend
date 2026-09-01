import { defineStore } from "pinia";
import axios from "../axios";

export const useCommentStore = defineStore("comments", () => {
  async function fetchComments(imageId) {
    try {
      let allComments = [];
      let cursor = null;
      let lastResponse = null;

      do {
        const response = await axios.get(`/api/images/${imageId}/comments`, {
          params: cursor ? { cursor } : {},
          headers: {
            "Content-Type": "application/json",
          },
        });

        lastResponse = response.data;
        allComments = allComments.concat(lastResponse.data);
        cursor = lastResponse.meta?.next_cursor ?? null;
      } while (cursor);

      return {
        ...lastResponse,
        data: allComments,
        meta: { ...(lastResponse?.meta ?? {}), next_cursor: null },
      };
    } catch (error) {
      throw Error("Não foi possível carregar os comentários.");
    }
  }

  async function postComment(authHeader, imageId, content, parentId = null) {
    try {
      const response = await axios.post(
        "/api/comments",
        {
          image_id: imageId,
          content,
          ...(parentId && { parent_id: parentId }),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw Error("Não foi possível enviar o comentário.");
    }
  }

  async function updateComment(authHeader, commentId, content) {
    try {
      const response = await axios.patch(
        `/api/comments/${commentId}`,
        { content },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw Error("Não foi possível editar o comentário.");
    }
  }

  async function deleteComment(authHeader, commentId) {
    try {
      await axios.delete(`/api/comments/${commentId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
      });
      return true;
    } catch (error) {
      throw Error("Não foi possível remover o comentário.");
    }
  }

  async function toggleLike(authHeader, commentId) {
    try {
      const response = await axios.post(
        `/api/comments/${commentId}/like`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw Error("Não foi possível curtir o comentário.");
    }
  }

  async function fetchReplies(commentId, cursor = null) {
    try {
      const response = await axios.get(
        `/api/comments/${commentId}/replies`,
        {
          params: { cursor },
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      throw Error("Não foi possível carregar as respostas.");
    }
  }

  return {
    fetchComments,
    postComment,
    updateComment,
    deleteComment,
    toggleLike,
    fetchReplies,
  };
});