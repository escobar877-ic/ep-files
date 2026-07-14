import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getCookie(name) {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1];
}

api.interceptors.request.use((config) => {
  const csrfToken = getCookie('csrftoken');
  const unsafeMethod = !['get', 'head', 'options', 'trace'].includes(config.method?.toLowerCase());
  if (csrfToken && unsafeMethod) {
    config.headers['X-CSRFToken'] = decodeURIComponent(csrfToken);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isUnauthorized = error.response?.status === 401;
    const isBlocked =
      error.response?.data?.code === 'user_blocked' ||
      error.response?.data?.detail === 'Ваш аккаунт заблокирован администратором.';
    const requestUrl = error.config?.url || '';
    const isAuthRequest =
      requestUrl.includes('/auth/login/') ||
      requestUrl.includes('/auth/register/');
    const isAuthCheckRequest = requestUrl.includes('/auth/me/');
    const isRefreshRequest = requestUrl.includes('/auth/refresh/');

    if (isUnauthorized && !isAuthRequest && !isRefreshRequest && !error.config?._retry) {
      error.config._retry = true;
      try {
        await api.post('/auth/refresh/');
        return api(error.config);
      } catch (refreshError) {
        if (refreshError.response?.data?.code === 'user_blocked') {
          sessionStorage.setItem('auth_error', 'Ваш аккаунт заблокирован администратором.');
        }
      }
    }

    if ((isBlocked || (isUnauthorized && !isAuthCheckRequest && !isRefreshRequest)) && !isAuthRequest) {
      if (isBlocked) {
        sessionStorage.setItem('auth_error', 'Ваш аккаунт заблокирован администратором.');
      }

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const uploadFileApi = (file, { folderId = null, onProgress, signal } = {}) => api.post('/upload/', file, {
  timeout: 0,
  signal,
  headers: {
    'Content-Type': file.type || 'application/octet-stream',
    'X-EP-File-Name': encodeURIComponent(file.name),
    'X-EP-File-Size': String(file.size),
    ...(folderId ? { 'X-EP-Folder-Id': String(folderId) } : {}),
  },
  onUploadProgress: (event) => {
    const total = Number(event.total) || file.size;
    const loaded = Math.min(Number(event.loaded) || 0, total || file.size);
    const percent = total > 0 ? Math.min(100, Math.floor((loaded * 100) / total)) : 0;
    onProgress?.({
      loaded,
      total,
      percent,
      phase: total > 0 && loaded >= total ? 'saving' : 'uploading',
    });
  },
});

export function apiUrl(path) {
  const base = API_URL.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

export function filePreviewPath(file) {
  const version = file?.updated_at || file?.date || '';
  const query = version ? `?v=${encodeURIComponent(version)}` : '';
  return `/preview/${file.id}/${query}`;
}

const prefetchedImageUrls = new Set();
const previewableImageExtensions = new Set(['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg']);

export function prefetchImagePreview(file) {
  const extension = String(file?.name || '').split('.').pop().toLowerCase();
  if (!file?.id || !previewableImageExtensions.has(extension) || Number(file.size || 0) > 12 * 1024 * 1024) return;
  const url = apiUrl(filePreviewPath(file));
  if (prefetchedImageUrls.has(url)) return;
  prefetchedImageUrls.add(url);
  const image = new Image();
  image.decoding = 'async';
  image.onerror = () => prefetchedImageUrls.delete(url);
  image.src = url;
}

export function startBrowserDownload(path, fileName) {
  const link = document.createElement('a');
  link.href = /^https?:\/\//i.test(path) ? path : apiUrl(path);
  link.setAttribute('download', fileName);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export const downloadFileApi = (fileId, fileName) => startBrowserDownload(`/download/${fileId}/`, fileName);

export const readTextFileApi = (fileId) => api.get(`/files/${fileId}/content/`);
export const saveTextFileApi = (fileId, content) => api.post(`/files/${fileId}/save/`, { content });

export default api;
