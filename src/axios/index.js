import axios from "axios"

axios.defaults.baseURL = import.meta.env.VUE_APP_BASE_REQUEST_URL

axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*'
axios.defaults.headers.common['Access-Control-Allow-Methods'] = 'GET, POST'
axios.defaults.headers.common['Access-Control-Allow-Headers'] = 'Content-Type'
axios.defaults.headers.common['Accept'] = 'application/json'

export default axios