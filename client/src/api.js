export const getToken = () => localStorage.getItem('token');

async function call(url, method = 'GET', body, esForm = false) {
  const headers = {};
  if (getToken()) headers.Authorization = 'Bearer ' + getToken();
  if (body && !esForm) headers['Content-Type'] = 'application/json';
  const r = await fetch('/api' + url, { method, headers, body: esForm ? body : body && JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

export const api = {
  yo: () => call('/auth/yo'),
  login: (b) => call('/auth/login', 'POST', b),
  registro: (b) => call('/auth/registro', 'POST', b),
  comercios: (q = '', cat = '') => call(`/comercios?q=${encodeURIComponent(q)}&categoria=${encodeURIComponent(cat)}`),
  comercio: (id) => call('/comercios/' + id),
  clic: (id) => call(`/comercios/${id}/clic`, 'POST'),
  fotos: (id) => call(`/comercios/${id}/fotos`),
  resenas: (id) => call(`/comercios/${id}/resenas`),
  resenar: (id, b) => call(`/comercios/${id}/resenas`, 'POST', b),
  favoritos: () => call('/favoritos'),
  toggleFav: (id) => call('/favoritos/' + id, 'POST'),
  referidos: () => call('/referidos'),
  miNegocio: () => call('/mi-negocio'),
  guardarNegocio: (b) => call('/mi-negocio', 'PUT', b),
  enviarNegocio: () => call('/mi-negocio/enviar', 'POST'),
  subirFoto: (fd) => call('/mi-negocio/fotos', 'POST', fd, true),
  borrarFoto: (id) => call('/mi-negocio/fotos/' + id, 'DELETE'),
  pendientes: () => call('/admin/pendientes'),
  publicar: (id) => call(`/admin/comercios/${id}/publicar`, 'PUT'),
  rechazar: (id) => call(`/admin/comercios/${id}/rechazar`, 'PUT'),
    crearSuscripcion: () => call('/pagos/suscripcion', 'POST', {}),
  estadoSuscripcion: () => call('/pagos/estado'),
};
