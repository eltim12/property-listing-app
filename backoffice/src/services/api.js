import axios from "axios";

const apiOrigin = (
  import.meta.env.VITE_API_ORIGIN || "http://localhost:4000"
).replace(/\/$/, "");

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || `${apiOrigin}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { apiOrigin };

export default {
  async login(email, password) {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  async me() {
    const response = await api.get("/auth/me");
    return response.data;
  },

  async getListings(params = {}) {
    const response = await api.get("/admin/listings", { params });
    return response.data;
  },

  async getListing(id) {
    const response = await api.get(`/admin/listings/${id}`);
    return response.data;
  },

  async createListing(data) {
    const response = await api.post("/admin/listings", data);
    return response.data;
  },

  async updateListing(id, data) {
    const response = await api.put(`/admin/listings/${id}`, data);
    return response.data;
  },

  async deleteListing(id) {
    const response = await api.delete(`/admin/listings/${id}`);
    return response.data;
  },

  async uploadListingImages(id, files) {
    const formData = new FormData();
    for (const file of files) {
      formData.append("images", file);
    }
    const response = await api.post(`/admin/listings/${id}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async deleteListingImage(id, imageId) {
    const response = await api.delete(
      `/admin/listings/${id}/images/${imageId}`,
    );
    return response.data;
  },

  async getAmenities() {
    const response = await api.get("/amenities");
    return response.data;
  },

  async getSettings() {
    const response = await api.get("/settings/admin");
    return response.data;
  },

  async updateSettings(data) {
    const response = await api.put("/settings/admin", data);
    return response.data;
  },
};
