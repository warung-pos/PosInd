// Helper utilitas untuk memanggil API backend dengan JWT Authorization
export const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Salin header yang dikirim oleh pemanggil
  const headers = {
    ...options.headers,
  };

  // Sisipkan JWT token jika ada
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Sisipkan x-user-id jika ada (untuk kompatibilitas backend limit plan)
  if (user && user.id) {
    headers['x-user-id'] = String(user.id);
  }

  // Lakukan request fetch asli
  return fetch(url, {
    ...options,
    headers,
  });
};
