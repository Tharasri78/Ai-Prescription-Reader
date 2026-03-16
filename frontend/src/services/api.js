import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

export const uploadPrescription = (file) => {

  const formData = new FormData();
  formData.append("file", file);

  return API.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};