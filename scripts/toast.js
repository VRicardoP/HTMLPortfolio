/**
 * Sistema de toasts cyberpunk personalizado
 * Integrado con la estética del portfolio
 * Esto crea notificaciones cuando se minimiza o maximiza una ventana
 */
let activeToasts = [];
let toastCounter = 0;

// Función para mostrar un toast personalizado
function showCyberpunkToast(message, duration = 3000) {
  const toastId = 'toast-' + toastCounter++;
  
  // Crear el elemento toast
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = 'cyberpunk-toast';
  
  // Crear contenido interno del toast con diseño cyberpunk
  toast.innerHTML = `
    <div class="toast-border"></div>
    <div class="toast-content">
      <div class="toast-icon">
        <div class="toast-icon-pulse"></div>
      </div>
      <div class="toast-message">${message}</div>
    </div>
  `;
  
  // Añadir al DOM
  document.body.appendChild(toast);
  activeToasts.push(toastId);
  
  // Posicionar los toasts en cascada
  positionToasts();
  
  // Añadir clase de entrada para animar
  setTimeout(() => {
    toast.classList.add('toast-visible');
  }, 10);
  
  // Auto eliminar después de la duración
  setTimeout(() => {
    removeToast(toastId);
  }, duration);
  
  return toastId;
}

// Posicionar toasts en cascada
function positionToasts() {
  const toasts = activeToasts.map(id => document.getElementById(id)).filter(el => el);
  
  toasts.forEach((toast, index) => {
    toast.style.bottom = (20 + (index * 70)) + 'px';
  });
}

// Eliminar un toast específico
function removeToast(toastId) {
  const toast = document.getElementById(toastId);
  if (!toast) return;
  
  // Animación de salida
  toast.classList.remove('toast-visible');
  toast.classList.add('toast-hidden');
  
  // Eliminar del DOM después de la animación
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
    
    // Eliminar de la lista activa
    activeToasts = activeToasts.filter(id => id !== toastId);
    
    // Reposicionar los toasts restantes
    positionToasts();
  }, 300);
}

// Modificar las funciones de control de ventanas para mostrar toasts
function modifyWindowControls() {
  // Reemplazar la función de minimizar
  const originalMinimize = window.toggleMinimize;
  window.toggleMinimize = function(windowId) {
    const windowElement = document.getElementById(windowId);
    const isMinimized = minimizedWindows[windowId];
    
    // Llamar a la función original
    originalMinimize(windowId);
    
    // Mostrar toast apropiado
    if (isMinimized) {
      showCyberpunkToast(`${windowElement.querySelector('.window-title').textContent} restored`);
    } else {
      showCyberpunkToast(`${windowElement.querySelector('.window-title').textContent} minimized`);
    }
  };
  
  // Reemplazar la función de maximizar
  const originalMaximize = window.toggleMaximize;
  window.toggleMaximize = function(windowId) {
    const windowElement = document.getElementById(windowId);
    const isMaximized = maximizedWindows[windowId];
    
    // Llamar a la función original
    originalMaximize(windowId);
    
    // Mostrar toast apropiado solo si cambiamos a/desde estado maximizado
    // (no mostrar si estamos restaurando desde minimizado)
    if (!minimizedWindows[windowId]) {
      if (isMaximized) {
        showCyberpunkToast(`${windowElement.querySelector('.window-title').textContent} restored`);
      } else {
        showCyberpunkToast(`${windowElement.querySelector('.window-title').textContent} maximized`);
      }
    }
  };
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  modifyWindowControls();
  
  // Tooltip hover para los botones de control
  const controlButtons = document.querySelectorAll('.control-btn');
  controlButtons.forEach(btn => {
    btn.addEventListener('mouseenter', (e) => {
      const action = btn.classList.contains('control-minimize') ? 'Minimize' : 'Maximize';
      const windowTitle = btn.closest('.window-header').querySelector('.window-title').textContent;
      
      const tooltip = document.createElement('div');
      tooltip.className = 'cyberpunk-tooltip';
      tooltip.textContent = action;
      document.body.appendChild(tooltip);
      
      // Posicionar tooltip
      const rect = btn.getBoundingClientRect();
      tooltip.style.top = (rect.top - 30) + 'px';
      tooltip.style.left = (rect.left - (tooltip.offsetWidth / 2) + (btn.offsetWidth / 2)) + 'px';
      
      // Guardar referencia al tooltip en el botón
      btn.tooltip = tooltip;
    });
    
    btn.addEventListener('mouseleave', () => {
      if (btn.tooltip) {
        btn.tooltip.remove();
        btn.tooltip = null;
      }
    });
  });
});