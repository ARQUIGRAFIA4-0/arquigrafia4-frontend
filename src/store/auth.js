import { defineStore } from 'pinia'

import axios from "../axios"

export const authStore = defineStore('auth', {
  state: () => ({
    loggedUser: JSON.parse(localStorage.getItem('loggedUser')) || '',
    tokenType: localStorage.getItem('tokenType') || '',
    accessToken: localStorage.getItem('accessToken') || '',
    refreshToken: localStorage.getItem('refreshToken') || '',
    isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
    isVerifying: false,
    verificationEmail: '',
  }),
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
      await axios.post('/oauth/token', sendData)
        .then(response => {
          this.tokenType = response.data.token_type;
          this.accessToken = response.data.access_token;
          this.refreshToken = response.data.refresh_token;
          this.isLoggedIn = true;

          // Save to localStorage
          localStorage.setItem('tokenType', this.tokenType);
          localStorage.setItem('accessToken', this.accessToken);
          localStorage.setItem('refreshToken', this.refreshToken);
          localStorage.setItem('isLoggedIn', this.isLoggedIn);
        })
        .catch((error) => {
          console.error('Login error:', error);
          this.isLoggedIn = false;
          localStorage.setItem('isLoggedIn', this.isLoggedIn);
        });
    },
    async getLoggedUser() {
      if (!this.accessToken) {
        console.error('Access token is missing');
        return;
      }

      await axios.get('/api/me', {
        headers: {
          'Authorization': 'Bearer ' + this.accessToken
        }
      })
        .then(response => {
          this.loggedUser = response.data.user;

          // Save to localStorage
          localStorage.setItem('loggedUser', JSON.stringify(this.loggedUser));
        })
        .catch((error) => {
          console.error('Error fetching logged user:', error);
        });
    },
    async logout() {
      try {
        if (this.accessToken) {
          await axios.post('/api/logout', {}, {
            headers: {
              'Authorization': 'Bearer ' + this.accessToken
            }
          });
        }
      } catch (error) {
        console.error('Error revoking token:', error);
      }

      // Clear state and localStorage
      this.loggedUser = '';
      this.tokenType = '';
      this.accessToken = '';
      this.refreshToken = '';
      this.isLoggedIn = false;
      this.isVerifying = false;
      this.verificationEmail = '';

      localStorage.removeItem('loggedUser');
      localStorage.removeItem('tokenType');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isLoggedIn');
    },

    async registerUser(userData) {
      try {
        await axios.post('/api/users', userData, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        return true;
      } catch (error) {
        console.error('Error registering user:', error);
        throw error;
      }
    },

    async sendVerificationEmail(email) {
      try {
        await axios.post('/api/account-verification-email', { email });
        this.isVerifying = true;
        this.verificationEmail = email;
        return true;
      } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
      }
    },

    async verifyAccount(email, code) {
      try {
        await axios.post('/api/verify-account', { email, code });
        return true;
      } catch (error) {
        console.error('Error verifying account:', error);
        throw error;
      }
    }
  },
});