import { minimizedWindows, maximizedWindows } from './window-state.js';
import { removeResizeHandles, makeWindowResizable, updateWindowResizability } from './window-resize.js';

// Función para minimizar/restaurar ventanas (botón púrpura)
export function toggleMinimize(windowId) {
  const windowElement = document.getElementById(windowId);
  if (windowElement) {
    // Si está maximizada, primero restaurar a tamaño normal
    if (maximizedWindows[windowId]) {
      maximizedWindows[windowId] = false;
      windowElement.classList.remove('window-maximized');

      // Posicionar en una ubicación visible después de restaurar
      setTimeout(() => {
        windowElement.style.transition = 'all 0.5s ease';
        windowElement.style.top = '200px';
        windowElement.style.left = (300 + Math.random() * 200) + 'px';

        // Luego minimizar
        setTimeout(() => {
          if (window.menuPositions && window.menuPositions[windowId]) {
            const position = window.menuPositions[windowId];
            windowElement.style.top = position.top + 'px';
            windowElement.style.left = position.left + 'px';
          }
          windowElement.classList.add('window-collapsed');
          minimizedWindows[windowId] = true;

          // Asegurarse de eliminar los controladores de redimensionamiento
          removeResizeHandles(windowElement);
        }, 200);
      }, 100);
    } else {
      // Alternar entre minimizado y normal
      minimizedWindows[windowId] = !minimizedWindows[windowId];
      windowElement.classList.toggle('window-collapsed', minimizedWindows[windowId]);

      // Si está minimizada, eliminar controladores de redimensionamiento
      if (minimizedWindows[windowId]) {
        removeResizeHandles(windowElement);
      }

      // Si expandimos una ventana desde el menú, moverla a una posición más visible
      if (!minimizedWindows[windowId] && window.isInitialState !== undefined && !window.isInitialState) {
        windowElement.style.transition = 'all 0.5s ease';
        windowElement.style.top = '200px';
        windowElement.style.left = (300 + Math.random() * 200) + 'px';

        // Añadir controladores de redimensionamiento solo si no está minimizada ni maximizada
        setTimeout(() => {
          if (!minimizedWindows[windowId] && !maximizedWindows[windowId]) {
            makeWindowResizable(windowElement);
          }
        }, 100);
      }
    }
    // Actualizar los controladores de redimensionamiento
    setTimeout(updateWindowResizability, 100);
  }
}

// Función para maximizar/restaurar ventanas (botón amarillo)
export function toggleMaximize(windowId) {
  const windowElement = document.getElementById(windowId);
  if (windowElement) {
    // Si está minimizada, restaurar a tamaño normal
    if (minimizedWindows[windowId]) {
      minimizedWindows[windowId] = false;
      windowElement.classList.remove('window-collapsed');

      // Posicionar en una ubicación visible y NO maximizar
      windowElement.style.transition = 'all 0.5s ease';
      windowElement.style.top = '200px';
      windowElement.style.left = (300 + Math.random() * 200) + 'px';

      // No hacer nada más - solo restaurar a tamaño normal
    } else {
      // Solo si NO está minimizada, alternar entre maximizado y normal
      maximizedWindows[windowId] = !maximizedWindows[windowId];
      windowElement.classList.toggle('window-maximized', maximizedWindows[windowId]);

      // Si está maximizada, eliminar controladores de redimensionamiento
      if (maximizedWindows[windowId]) {
        removeResizeHandles(windowElement);
      }

      // Si restauramos de maximizado, posicionar en una ubicación visible
      if (!maximizedWindows[windowId]) {
        windowElement.style.transition = 'all 0.5s ease';
        windowElement.style.top = '200px';
        windowElement.style.left = (300 + Math.random() * 200) + 'px';
      }
    }
    // Actualizar los controladores de redimensionamiento
    setTimeout(updateWindowResizability, 100);
  }
}

// Función para cerrar ventana con animación fade out
export function closeWindow(windowId) {
  const windowElement = document.getElementById(windowId);
  if (windowElement) {
    // Animación especial para la ventana de información
    if (windowId === 'infoWindow') {
      windowElement.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
      windowElement.style.opacity = '0';
      windowElement.style.transform = 'translate(-50%, -50%) scale(0.8)';
      
      setTimeout(() => {
        windowElement.style.display = 'none';
        // Resetear estilos para posible reutilización
        windowElement.style.opacity = '1';
        windowElement.style.transform = 'translate(-50%, -50%) scale(1)';
      }, 500);
    } else {
      // Animación estándar para otras ventanas
      windowElement.style.transition = 'opacity 0.3s ease-out';
      windowElement.style.opacity = '0';
      setTimeout(() => {
        windowElement.style.display = 'none';
        windowElement.style.opacity = '1'; // Resetear para cuando se vuelva a mostrar
      }, 300);
    }
    
    // Actualizar estado
    if (window.visibleWindows) {
      window.visibleWindows[windowId] = false;
    }
  }
}