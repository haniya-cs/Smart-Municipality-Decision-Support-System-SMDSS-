import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:5000",
  withCredentials: true,
});

export default apiClient;

const getSession = () => {
  try {
    return JSON.parse(localStorage.getItem('smdss_session') || '{}');
  } catch {
    return {};
  }
};

const getAuthHeaders = () => {
  const session = getSession();
  if (!session.token) return {};
  return {
    Authorization: `Bearer ${session.token}`
  };
};

const authorizedFetch = (url, options = {}) => {
  const headers = {
    ...options.headers,
    ...getAuthHeaders()
  };
  return fetch(url, { ...options, headers });
};

export { getSession, getAuthHeaders, authorizedFetch };
