// /home/lothar/Programming/rain-background/Proyecto/dashboard-layout.js

// Asegura que la variable global isInitialState esté disponible, con valor por defecto true.
// Esta variable es utilizada por windowsDashboard.js y effects.js.
if (typeof isInitialState === 'undefined') {
  // eslint-disable-next-line no-unused-vars
  var isInitialState = true; // Se establecerá a false después de la disposición del menú.
}

// Asegura que la variable global menuPositions esté disponible.
// Es utilizada por windowsDashboard.js para restaurar ventanas.
if (typeof menuPositions === 'undefined') {
  // eslint-disable-next-line no-unused-vars
  var menuPositions = {}; // Se poblará en setupDashboardMenuLayout.
}

// IDs de las ventanas específicas del dashboard
const dashboardWindowIds = [
  'generalStatsWindow',
  'topStatsWindow',
  'mapWindow',
  'recentVisitorsWindow',
  'jobicyJobsWindow',
  'remotiveJobsWindow' // <--- Añadir la nueva ventana
];

// Posiciones iniciales en cascada para las ventanas del dashboard
const dashboardCascadePositions = {
  'generalStatsWindow': { top: 70, left: 50 },
  'topStatsWindow': { top: 90, left: 100 },
  'mapWindow': { top: 110, left: 150 },
  'recentVisitorsWindow': { top: 130, left: 200 },
  'jobicyJobsWindow': { top: 150, left: 250 },
  'remotiveJobsWindow': { top: 170, left: 300 } // <--- Posición inicial para la nueva ventana
};

const MINIMIZED_WINDOW_WIDTH_ESTIMATE = 150; // Estimación del ancho de una ventana minimizada para cálculos de centrado.

// Efecto de máquina de escribir específico para el título del dashboard
function dashboardTypewriterEffect() {
  const textElement = document.getElementById('dashboard-typewriter-text'); // ID específico en dashboard.html
  const text = "Dashboard"; // Texto para el dashboard actualizado
  let i = 0;
  const speed = 100; // Velocidad en milisegundos por caracter

  if (textElement) {
    textElement.innerHTML = ""; // Limpiar texto existente (innerHTML para manejar el cursor si es un span)
    function type() {
      if (i < text.length) {
        textElement.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      } else {
        const cursor = textElement.nextElementSibling;
        if (cursor && cursor.classList.contains('terminal-cursor')) {
          cursor.style.display = 'inline'; // Mostrar cursor al final
        }
      }
    }
    // Si hay un cursor como span, asegurar que parpadea desde el inicio
    const initialCursor = textElement.nextElementSibling;
    if (initialCursor && initialCursor.classList.contains('terminal-cursor')) {
      initialCursor.style.display = 'inline';
    }
    type();
  } else {
    console.warn("Elemento con ID 'dashboard-typewriter-text' no encontrado para el efecto de máquina de escribir.");
  }
}

// Función para posicionar las ventanas del dashboard en cascada
function setupDashboardCascadeLayout() {
  isInitialState = true; // Marcar que estamos en la fase inicial

  dashboardWindowIds.forEach(windowId => {
    const windowElement = document.getElementById(windowId);
    if (windowElement) {
      const position = dashboardCascadePositions[windowId];
      if (position) {
        windowElement.style.position = 'fixed';
        windowElement.style.top = position.top + 'px';
        windowElement.style.left = position.left + 'px';
        windowElement.style.transform = 'none';
        windowElement.style.transition = 'all 0.8s ease-in-out';

        windowElement.classList.remove('window-collapsed');

        // Registrar la ventana y habilitar interacciones (arrastrar, redimensionar, estados)
        // Se asume que las ventanas comienzan sin minimizar en la cascada.
        if (typeof registerAndEnableWindowInteractions === "function") {
          registerAndEnableWindowInteractions(windowElement, { minimized: false, maximized: false });
        } else {
          console.error(`La función registerAndEnableWindowInteractions no está definida. Error al configurar ${windowId}.`);
        }

        // Añadir listeners para el estado de 'mouseOver' (usado por effects.js)
        // isMouseOverWindowState es inicializado por registerAndEnableWindowInteractions en windowsDashboard.js
        if (typeof isMouseOverWindowState !== 'undefined') {
          windowElement.addEventListener('mouseenter', () => {
            if (isMouseOverWindowState.hasOwnProperty(windowId)) {
              isMouseOverWindowState[windowId] = true;
            }
          });
          windowElement.addEventListener('mouseleave', () => {
            if (isMouseOverWindowState.hasOwnProperty(windowId)) {
              isMouseOverWindowState[windowId] = false;
            }
          });
        }
      } else {
        console.warn(`Posición en cascada no definida para la ventana ID: ${windowId}`);
      }
    } else {
      console.warn(`Elemento ventana no encontrado para ID: ${windowId} en setupDashboardCascadeLayout`);
    }
  });

  // Actualizar la capacidad de redimensionamiento globalmente después de la configuración inicial
  if (typeof updateWindowResizability === "function") {
    setTimeout(updateWindowResizability, 100); // Pequeño retardo
  }
}

// Función para posicionar las ventanas del dashboard en un menú horizontal
function setupDashboardMenuLayout() {
  const windowCount = dashboardWindowIds.length;
  if (windowCount === 0) return;

  const screenWidth = window.innerWidth;
  const menuBarTotalWidth = Math.min(screenWidth * 0.8, windowCount * (MINIMIZED_WINDOW_WIDTH_ESTIMATE + 20)); // Ancho total del menú, con algo de espaciado
  const startX = (screenWidth - menuBarTotalWidth) / 2; // Centrar el menú
  const itemSlotWidth = menuBarTotalWidth / windowCount; // Espacio disponible por ítem
  const menuY = 120; // Posición Y fija para el menú superior

  dashboardWindowIds.forEach((windowId, index) => {
    const windowElement = document.getElementById(windowId);
    if (windowElement) {
      // Calcular la posición izquierda para centrar la ventana minimizada en su "slot"
      const minimizedWidth = parseFloat(windowElement.style.width) || MINIMIZED_WINDOW_WIDTH_ESTIMATE; // Usar ancho actual o estimado
      const calculatedLeft = startX + (index * itemSlotWidth) + (itemSlotWidth / 2) - (minimizedWidth / 2);

      const targetPosition = {
        top: menuY,
        left: calculatedLeft
      };

      // Actualizar la variable global menuPositions (usada por toggleMinimize en windowsDashboard.js)
      if (typeof menuPositions !== 'undefined') {
        menuPositions[windowId] = { top: targetPosition.top + 'px', left: targetPosition.left + 'px' };
      }

      windowElement.style.transition = 'all 0.8s ease-in-out';
      windowElement.style.top = targetPosition.top + 'px';
      windowElement.style.left = targetPosition.left + 'px';

      // Minimizar con retardo para efecto escalonado
      setTimeout(() => {
        windowElement.classList.add('window-collapsed');
        if (typeof minimizedWindows !== 'undefined') {
          minimizedWindows[windowId] = true;
        }
        if (typeof maximizedWindows !== 'undefined') {
          maximizedWindows[windowId] = false; // No puede estar maximizada si está colapsada
        }
        windowElement.classList.remove('window-maximized');

        // Eliminar manejadores de redimensionamiento al minimizar
        if (typeof removeResizeHandles === "function") {
          removeResizeHandles(windowElement);
        }
      }, 200 + (index * 100)); // Retardo escalonado
    } else {
      console.warn(`Elemento ventana no encontrado para ID: ${windowId} en setupDashboardMenuLayout`);
    }
  });

  isInitialState = false; // Marcar que la configuración inicial ha terminado

  // Actualizar la capacidad de redimensionamiento globalmente después de que todas las ventanas se hayan minimizado
  if (typeof updateWindowResizability === "function") {
    setTimeout(updateWindowResizability, 200 + (windowCount * 100) + 100);
  }
}

// Función principal para inicializar la disposición de las ventanas del dashboard
function initializeDashboardLayout() {
  setupDashboardCascadeLayout();
  setTimeout(setupDashboardMenuLayout, 3000); // Transición a menú después de 3 segundos
}

// Listener para cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', () => {
  let allElementsFound = true;
  dashboardWindowIds.forEach(id => {
    if (!document.getElementById(id)) {
      console.warn(`Elemento ventana del dashboard con ID '${id}' no encontrado.`);
      allElementsFound = false;
    }
  });

  if (!allElementsFound) {
    console.error("Faltan elementos de ventana cruciales para el dashboard. La funcionalidad estará limitada.");
  }

  dashboardTypewriterEffect();

  if (typeof setupMouseMoveEffect === "function") {
    setupMouseMoveEffect(); // Activar efecto parallax del ratón (de effects.js)
  } else {
    console.warn("La función setupMouseMoveEffect no se encontró (esperada de effects.js).");
  }

  setTimeout(initializeDashboardLayout, 500); // Iniciar la disposición con un pequeño retardo
});

// Fallback por si DOMContentLoaded se dispara demasiado pronto
window.addEventListener('load', () => {
  if (typeof isInitialState !== 'undefined' && isInitialState) { // Solo si la inicialización no ha ocurrido
    console.log("Fallback: window.load disparó initializeDashboardLayout.");
    setTimeout(initializeDashboardLayout, 200);
  }
});