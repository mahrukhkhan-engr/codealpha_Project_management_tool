import axios from "axios";

// Direct Live Backend URL (Apne Vercel Backend URL se replace karein)
const API_BASE_URL = "https://taskstream-backend-7u5w0y5h5-engr-mk.vercel.app/api"; 

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;