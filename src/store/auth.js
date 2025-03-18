import { defineStore } from 'pinia'

import axios from "axios"

export const authStore = defineStore('auth', {
  state: () => ({
    loggedUser: '',
    tokenType: '',
    accessToken: '',
    refreshToken: '',
    deuCerto: false,
  }),
  getters: {
  },
  actions: {
    async getAccessToken(formData) {
      var sendData = {
        'grant_type': import.meta.env.VITE_GRANT_TYPE,
        'client_id': import.meta.env.VITE_CLIENT_ID,
        'client_secret': import.meta.env.VITE_CLIENT_SECRET,
        'username': formData.email,
        'password': formData.password,
        'scope': '*',
      };
      var loginRequest = await axios.post('http://localhost:8000/oauth/token', sendData)
      .then(response => {
        this.tokenType = response.data.token_type;
        this.accessToken = response.data.access_token;
        this.refreshToken = response.data.refresh_token;
        this.deuCerto = true;
      })
      .catch(function (error) {
        // handle error
        this.deuCerto = true;
      });

    },
    async getLoggedUser() {
      var loggedRequest = await axios.get('http://localhost:8000/api/me', {
        headers: {
          'Authorization': 'Bearer ' + this.accessToken
        }
      })
      .then(response => {
        this.loggedUser = response.data.user;
      })
      .catch(function (error) {
        // handle error
      });
    },
  },
})