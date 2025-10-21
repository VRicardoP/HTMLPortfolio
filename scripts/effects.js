// effects.js - Convertido a módulo ES6
import { windows, isMouseOverWindowState, minimizedWindows } from './window-state.js';

// Variable para controlar si estamos en el estado inicial
let isInitialState = true;

// Efecto sutil de movimiento para ventanas no activas (solo cuando no están minimizadas)
function setupMouseMoveEffect() {
  document.addEventListener('mousemove', onGlobalMouseMove);

  function onGlobalMouseMove(event) {
    // Solo aplicar efecto si no estamos en estado inicial y las ventanas no están minimizadas
    if (isInitialState) return;

    Object.keys(windows).forEach(windowId => {
      if (windows[windowId] && !isMouseOverWindowState[windowId] && !minimizedWindows[windowId]) {
        const win = windows[windowId];

        // No aplicar efecto si está maximizada
        if (win.classList.contains('window-maximized')) {
          return;
        }

        // Calcular el centro de la ventana
        const rect = win.getBoundingClientRect();
        const winCenterX = rect.left + rect.width / 2;
        const winCenterY = rect.top + rect.height / 2;

        // Calcular la distancia entre el ratón y el centro de la ventana
        const distX = (event.clientX - winCenterX) / 80;
        const distY = (event.clientY - winCenterY) / 80;

        // Aplicar un efecto muy sutil
        win.style.transform = `translate(${distX}px, ${distY}px)`;
      }
    });
  }
}

// Efecto de typewriter para el título
function typeWriterEffect() {
  const textElement = document.getElementById('typewriter-text');
  const text = "Vicente R. Pau > Portfolio";
  let i = 0;
  const speed = 100; // velocidad de escritura en milisegundos

  function type() {
    if (i < text.length) {
      textElement.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }

  // Iniciar el efecto de escritura
  if (textElement) {
    textElement.textContent = "";
    type();
  }
}

// Función para cambiar el estado inicial
export function setInitialState(state) {
  isInitialState = state;
}

// Exportar las funciones
export { setupMouseMoveEffect, typeWriterEffect };