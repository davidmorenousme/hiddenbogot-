// Idiomas disponibles en la lista (código de Google Translate, nombre)
export const IDIOMAS = [['es', 'Español'], ['en', 'English'], ['fr', 'Français'], ['pt', 'Português'], ['de', 'Deutsch'], ['it', 'Italiano'], ['zh-CN', '中文'], ['ja', '日本語'], ['ko', '한국어'], ['ru', 'Русский'], ['ar', 'العربية']];

// El traductor guarda el idioma elegido en una cookie llamada googtrans (formato /es/en)
export const idiomaActual = () => {
  const m = document.cookie.match(/googtrans=\/es\/([^;]+)/);
  return m ? m[1] : 'es';
};

export function cambiarIdioma(l) {
  const borrar = 'expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
  document.cookie = 'googtrans=;' + borrar;
  document.cookie = 'googtrans=;' + borrar + ';domain=' + location.hostname;
  if (l !== 'es') document.cookie = 'googtrans=/es/' + l + ';path=/';
  location.reload(); // al recargar, Google traduce toda la página al idioma elegido
}