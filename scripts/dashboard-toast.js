/**
 * Asegura que el contenedor de toasts exista en el DOM.
 * Si no existe, lo crea y lo añade al body.
 * @returns {HTMLElement} El elemento contenedor de toasts.
 */
function ensureToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    // Estilos para el contenedor de toasts
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '10500'; // Un z-index alto para estar sobre otros elementos como ventanas flotantes
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'flex-end'; // Alinea los toasts a la derecha
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Muestra un mensaje toast.
 * @param {string} message - El mensaje a mostrar.
 * @param {string} [type='info'] - El tipo de toast ('info', 'success', 'error', 'warning').
 * @param {number} [duration=3000] - La duración en milisegundos antes de que el toast se oculte.
 */
// eslint-disable-next-line no-unused-vars
function showToast(message, type = 'info', duration = 3000) {
  const container = ensureToastContainer();

  const toast = document.createElement('div');
  // Clases para permitir estilización externa, además de los estilos base inline
  toast.className = `toast toast-${type}`;

  // Estilos base del toast
  toast.style.padding = '12px 20px';
  toast.style.margin = '8px 0';
  toast.style.borderRadius = '4px';
  toast.style.color = '#fff';
  toast.style.fontSize = '14px';
  toast.style.fontFamily = 'Arial, sans-serif';
  toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(100%)'; // Empieza fuera de la pantalla (derecha)
  toast.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.justifyContent = 'space-between';

  // Estilos específicos por tipo de toast
  switch (type) {
    case 'success':
      toast.style.backgroundColor = '#28a745'; // Verde
      break;
    case 'error':
      toast.style.backgroundColor = '#dc3545'; // Rojo
      break;
    case 'warning':
      toast.style.backgroundColor = '#ffc107'; // Amarillo
      toast.style.color = '#212529'; // Texto oscuro para mejor contraste en amarillo
      break;
    case 'info':
    default:
      toast.style.backgroundColor = '#17a2b8'; // Azul
      break;
  }

  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  toast.appendChild(messageSpan);

  const removeToast = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)'; // Deslizar hacia afuera
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 400); // Coincidir con la duración de la transición
  };

  closeButton.onclick = removeToast;
  toast.appendChild(closeButton);

  container.appendChild(toast);

  // Forzar reflujo para asegurar que la animación de entrada se ejecute
  // eslint-disable-next-line no-unused-expressions
  toast.offsetHeight;

  // Animar la entrada del toast
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(0)';

  // Auto-descartar el toast después de la duración especificada
  setTimeout(removeToast, duration);
}

// Todo: llamar a showToast desde otros scripts (ej. dashboard.js):
// showToast('¡Bienvenido al Dashboard!', 'info');
// showToast('Datos cargados correctamente.', 'success', 5000);
// showToast('Error al obtener estadísticas.', 'error');