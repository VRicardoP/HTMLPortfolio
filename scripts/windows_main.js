// Archivo principal para importar y usar el sistema de ventanas
import { initializeWindows, toggleMinimize, toggleMaximize } from './window-manager.js';
import { initializeLayoutSystem } from './layout.js';

console.log('Cargando sistema de ventanas...');

// Inicializar variables globales necesarias
if (!window.menuPositions) {
  window.menuPositions = {
    'profileWindow': { top: 50, left: 50 },
    'softSkillsWindow': { top: 50, left: 150 },
    'educationWindow': { top: 50, left: 250 },
    'experienceWindow': { top: 50, left: 350 },
    'languagesWindow': { top: 50, left: 450 },
    'techSkillsWindow': { top: 50, left: 550 },
    'portfolioWindow': { top: 50, left: 650 },
    'contactWindow': { top: 50, left: 750 },
    'chatWindow': { top: 50, left: 850 }
  };
  console.log('Posiciones de menú inicializadas');
}

if (window.isInitialState === undefined) {
  window.isInitialState = true;
  console.log('Estado inicial configurado');
}

// Hacer las funciones disponibles globalmente
window.toggleMinimize = toggleMinimize;
window.toggleMaximize = toggleMaximize;
window.initializeWindows = initializeWindows;

// También necesitamos una función para cerrar ventanas si no existe
window.closeWindow = function(windowId) {
  const windowElement = document.getElementById(windowId);
  if (windowElement) {
    windowElement.style.display = 'none';
  }
};

console.log('Funciones globales configuradas');

// Función para inicializar cuando el DOM esté listo
function initWhenReady() {
  if (document.readyState === 'loading') {
    console.log('DOM cargándose, esperando DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOM cargado, inicializando sistemas...');
      // Asegurar que las funciones estén disponibles después de la inicialización
      setTimeout(() => {
        initializeWindows();
        initializeLayoutSystem();
        
        // Reconfirmar que las funciones están disponibles globalmente
        window.toggleMinimize = toggleMinimize;
        window.toggleMaximize = toggleMaximize;
        console.log('Funciones de control reconfiguradas');
      }, 100);
    });
  } else {
    console.log('DOM ya cargado, inicializando sistemas inmediatamente...');
    setTimeout(() => {
      initializeWindows();
      initializeLayoutSystem();
      
      // Reconfirmar que las funciones están disponibles globalmente
      window.toggleMinimize = toggleMinimize;
      window.toggleMaximize = toggleMaximize;
      console.log('Funciones de control reconfiguradas');
    }, 100);
  }
}

// Inicializar
initWhenReady();

// Marcar que ya no es el estado inicial después de un tiempo
setTimeout(() => {
  window.isInitialState = false;
  console.log('Estado inicial finalizado');
}, 2000);

// Función de debug para verificar el estado
window.debugWindows = function() {
  console.log('Estado del sistema de ventanas:');
  console.log('MenuPositions:', window.menuPositions);
  console.log('IsInitialState:', window.isInitialState);
  console.log('Funciones disponibles:', {
    toggleMinimize: typeof window.toggleMinimize,
    toggleMaximize: typeof window.toggleMaximize,
    initializeWindows: typeof window.initializeWindows,
    closeWindow: typeof window.closeWindow
  });
  
  // Verificar si los elementos existen
  console.log('Elementos encontrados:');
  ['profileWindow', 'softSkillsWindow', 'educationWindow', 'experienceWindow', 
   'languagesWindow', 'techSkillsWindow', 'portfolioWindow', 'contactWindow', 'chatWindow'].forEach(id => {
    const element = document.getElementById(id);
    console.log(`${id}:`, element ? 'OK' : 'NO ENCONTRADO');
  });
};

// Llamar debug automáticamente después de la inicialización
setTimeout(() => {
  window.debugWindows();
}, 3000);