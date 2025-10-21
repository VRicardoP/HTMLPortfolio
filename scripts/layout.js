// layout.js - Convertido a módulo ES6
import { windows, minimizedWindows, isMouseOverWindowState } from './window-state.js';
import { makeWindowDraggable } from './window-drag.js';
import { makeWindowResizable } from './window-resize.js';
import { setupMouseMoveEffect, typeWriterEffect, setInitialState } from './effects.js';

// Variable para controlar si estamos en el estado inicial
let isInitialState = true;

// Configuración inicial de posiciones en cascada
const cascadePositions = {
  'profileWindow': { top: 100, left: 100 },
  'softSkillsWindow': { top: 120, left: 150 },
  'educationWindow': { top: 140, left: 200 },
  'experienceWindow': { top: 160, left: 250 },
  'languagesWindow': { top: 180, left: 300 },
  'techSkillsWindow': { top: 200, left: 350 },
  'portfolioWindow': { top: 220, left: 400 },
  'contactWindow': { top: 240, left: 450 },
  'chatWindow': { top: 260, left: 500 }
};

// Configuración de posiciones minimizadas (menú horizontal)
const menuPositions = {
  'profileWindow': { top: 100, left: 100, index: 0 },
  'softSkillsWindow': { top: 100, left: 200, index: 1 },
  'educationWindow': { top: 100, left: 300, index: 2 },
  'experienceWindow': { top: 100, left: 400, index: 3 },
  'languagesWindow': { top: 100, left: 500, index: 4 },
  'techSkillsWindow': { top: 100, left: 600, index: 5 },
  'portfolioWindow': { top: 100, left: 700, index: 6 },
  'contactWindow': { top: 100, left: 800, index: 7 },
  'chatWindow': { top: 100, left: 900, index: 8 }
};

// Función para posicionar ventanas en cascada
function setupCascadeLayout() {
  Object.keys(windows).forEach(windowId => {
    const windowElement = windows[windowId];
    if (windowElement) {
      const position = cascadePositions[windowId];
      windowElement.style.position = 'fixed';
      windowElement.style.top = position.top + 'px';
      windowElement.style.left = position.left + 'px';
      windowElement.style.transform = 'none';
      windowElement.style.transition = 'all 0.8s ease-in-out';

      // Asegurar que están visibles
      windowElement.classList.remove('window-collapsed');
      minimizedWindows[windowId] = false;
    }
  });
}

// Función para posicionar ventanas en menú horizontal distribuido
function setupMenuLayout() {
  const windowCount = Object.keys(windows).length;
  const screenWidth = window.innerWidth;
  const menuWidth = Math.min(screenWidth * 0.8, 1200);
  const startX = (screenWidth - menuWidth) / 2;
  const itemSpacing = menuWidth / windowCount;
  const menuY = 100;

  Object.keys(windows).forEach((windowId, index) => {
    const windowElement = windows[windowId];
    if (windowElement) {
      const position = {
        top: menuY,
        left: startX + (index * itemSpacing),
        index: index
      };

      // Actualizar menuPositions para referencia futura
      menuPositions[windowId] = position;
      // También actualizar la variable global si existe
      if (window.menuPositions) {
        window.menuPositions[windowId] = position;
      }

      windowElement.style.top = position.top + 'px';
      windowElement.style.left = position.left + 'px';

      setTimeout(() => {
        windowElement.classList.add('window-collapsed');
        minimizedWindows[windowId] = true;
      }, 200 + (position.index * 100));
    }
  });

  isInitialState = false;
  setInitialState(false);
  if (window.isInitialState !== undefined) {
    window.isInitialState = false;
  }
}

// Función para inicializar las ventanas al cargar la página
function initializeWindows() {
  setupCascadeLayout();

  Object.keys(windows).forEach(windowId => {
    const windowElement = windows[windowId];
    if (windowElement) {
      makeWindowResizable(windowElement);
    }
  });

  setTimeout(() => {
    setupMenuLayout();
  }, 2000);
}

// Añadir eventos para cada ventana después de la inicialización
function setupWindowEvents() {
  Object.keys(windows).forEach(windowId => {
    const windowElement = windows[windowId];

    if (windowElement) {
      windowElement.addEventListener('mouseenter', () => {
        isMouseOverWindowState[windowId] = true;
      });

      windowElement.addEventListener('mouseleave', () => {
        isMouseOverWindowState[windowId] = false;
      });

      makeWindowDraggable(windowElement);
      makeWindowResizable(windowElement);
    }
  });
}

// Función principal de inicialización
function initializeLayoutSystem() {
  let allElementsFound = true;
  Object.keys(windows).forEach(windowId => {
    if (!windows[windowId]) {
      console.warn(`No se encontró el elemento con ID: ${windowId}`);
      allElementsFound = false;
    }
  });

  if (!allElementsFound) {
    console.warn('Algunos elementos no fueron encontrados, la funcionalidad puede ser limitada');
  }

  typeWriterEffect();
  setupWindowEvents();
  setupMouseMoveEffect();

  setTimeout(initializeWindows, 500);
}

// Exportar funciones necesarias
export { 
  initializeLayoutSystem, 
  setupCascadeLayout, 
  setupMenuLayout, 
  cascadePositions, 
  menuPositions 
};