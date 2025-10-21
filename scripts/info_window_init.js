// Script de inicialización para la ventana de información
// Este script se ejecuta al cargar la página para mostrar la ventana de bienvenida

// Función para inicializar la ventana de información
function initInfoWindow() {
  const infoWindow = document.getElementById('infoWindow');
  
  if (infoWindow) {
    // Asegurar que la ventana esté visible al cargar
    infoWindow.style.display = 'block';
    infoWindow.style.opacity = '1';
    
    // Añadir esta ventana a una lista de ventanas excluidas del sistema de reorganización
    if (!window.excludedWindows) {
      window.excludedWindows = [];
    }
    window.excludedWindows.push('infoWindow');
    
    // Opcional: Auto-cerrar después de un tiempo si el usuario no interactúa
    // setTimeout(() => {
    //   if (infoWindow.style.display !== 'none') {
    //     closeWindow('infoWindow');
    //   }
    // }, 30000); // 30 segundos
  }
}

// Función mejorada de closeWindow específica para la ventana de información
function closeInfoWindow() {
  const infoWindow = document.getElementById('infoWindow');
  if (infoWindow) {
    infoWindow.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
    infoWindow.style.opacity = '0';
    infoWindow.style.transform = 'translate(-50%, -50%) scale(0.8)';
    
    setTimeout(() => {
      infoWindow.style.display = 'none';
      // Resetear estilos para posible reutilización
      infoWindow.style.opacity = '1';
      infoWindow.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 500);
  }
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initInfoWindow);

// Hacer la función de cierre disponible globalmente
window.closeInfoWindow = closeInfoWindow;