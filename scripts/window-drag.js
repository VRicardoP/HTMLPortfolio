import { windows, minimizedWindows } from './window-state.js';

// Función para hacer las ventanas arrastrables
export function makeWindowDraggable(windowElement) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  let isDragging = false;
  const header = windowElement.querySelector('.window-header');

  // Obtener el ID de la ventana para futuras referencias
  const windowId = Object.keys(windows).find(key => windows[key] === windowElement);

  // Hacer arrastrable tanto por el header como por cualquier parte de la ventana
  if (header) {
    header.onmousedown = dragMouseDown;
  }
  windowElement.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;

    // No prevenir default inmediatamente para permitir clicks en botones
    const target = e.target;

    // Si se hace click en los botones de control, no iniciar arrastre
    if (target.classList.contains('control-btn')) {
      return;
    }

    e.preventDefault();
    isDragging = true;

    // No permitir arrastrar si está maximizada
    if (windowElement.classList.contains('window-maximized')) {
      return;
    }

    // Get the mouse cursor position at startup
    pos3 = e.clientX;
    pos4 = e.clientY;

    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;

    // Traer al frente la ventana activa
    windowElement.style.zIndex = 110;

    // Restablecer los z-index normales para otras ventanas
    Object.values(windows).forEach(win => {
      if (win && win !== windowElement) {
        win.style.zIndex = 100 + Object.values(windows).indexOf(win);
      }
    });

    // Cambiar cursor a grabbing
    windowElement.style.cursor = 'grabbing';
    if (header) header.style.cursor = 'grabbing';
  }

  function elementDrag(e) {
    if (!isDragging) return;

    e = e || window.event;
    e.preventDefault();

    // No permitir arrastrar si está maximizada
    if (windowElement.classList.contains('window-maximized')) {
      return;
    }

    // Calculate the new cursor position
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

    // Set the element's new position
    const currentTop = windowElement.offsetTop - pos2;
    const currentLeft = windowElement.offsetLeft - pos1;

    // Limitar el arrastre dentro de los límites de la ventana
    const maxTop = window.innerHeight - windowElement.offsetHeight;
    const maxLeft = window.innerWidth - windowElement.offsetWidth;

    const newTop = Math.max(0, Math.min(currentTop, maxTop));
    const newLeft = Math.max(0, Math.min(currentLeft, maxLeft));

    windowElement.style.top = newTop + "px";
    windowElement.style.left = newLeft + "px";
    windowElement.style.transform = 'none';

    // Temporalmente desactivar transiciones mientras se arrastra
    windowElement.style.transition = 'none';

    // Si la ventana está minimizada, actualizamos la posición en menuPositions para referencia futura
    if (minimizedWindows[windowId] && window.menuPositions) {
      window.menuPositions[windowId].top = newTop;
      window.menuPositions[windowId].left = newLeft;
    }
  }

  function closeDragElement() {
    isDragging = false;
    document.onmouseup = null;
    document.onmousemove = null;

    // Restaurar cursor
    windowElement.style.cursor = 'default';
    if (header) header.style.cursor = minimizedWindows[windowId] ? 'grab' : 'default';

    // Restaurar transiciones
    setTimeout(() => {
      windowElement.style.transition = 'all 0.8s ease-in-out';
    }, 100);
  }

  // Añadir efecto visual de hover en el header
  if (header) {
    header.addEventListener('mouseenter', () => {
      // Siempre mostrar cursor grab en el header, incluso en ventanas minimizadas
      if (!isDragging) {
        header.style.cursor = 'grab';
      }
    });

    header.addEventListener('mouseleave', () => {
      if (!isDragging) {
        header.style.cursor = 'default';
      }
    });
  }
}