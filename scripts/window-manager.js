import { windows, minimizedWindows, maximizedWindows, initializeWindowReferences } from './window-state.js';
import { makeWindowDraggable } from './window-drag.js';
import { makeWindowResizable, removeResizeHandles } from './window-resize.js';
import { toggleMinimize, toggleMaximize } from './window-controls.js';

// Inicializar o reiniciar todas las ventanas
export function initializeWindows() {
  console.log('Inicializando sistema de ventanas...');
  
  // Primero inicializar las referencias DOM
  initializeWindowReferences();

  // Verificar que las ventanas existen
  let windowsFound = 0;
  Object.keys(windows).forEach(windowId => {
    if (windows[windowId]) {
      windowsFound++;
    }
  });
  
  console.log(`Encontradas ${windowsFound} ventanas de ${Object.keys(windows).length} esperadas`);

  // Inicializar cada ventana
  Object.keys(windows).forEach(windowId => {
    const windowElement = windows[windowId];
    if (windowElement) {
      console.log(`Inicializando ventana: ${windowId}`);
      
      // Hacer arrastrable
      makeWindowDraggable(windowElement);

      // Aplicar estado inicial (minimizado/maximizado)
      if (minimizedWindows[windowId]) {
        windowElement.classList.add('window-collapsed');
        removeResizeHandles(windowElement);
      } else if (maximizedWindows[windowId]) {
        windowElement.classList.add('window-maximized');
        removeResizeHandles(windowElement);
      } else {
        // Solo hacer redimensionable si no está minimizada ni maximizada
        makeWindowResizable(windowElement);
      }
    } else {
      console.warn(`No se encontró la ventana: ${windowId}`);
    }
  });
  
  console.log('Sistema de ventanas inicializado correctamente');
}

// Exportar funciones para uso global
export { toggleMinimize, toggleMaximize };