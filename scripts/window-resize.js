import { windows, minimizedWindows, maximizedWindows } from './window-state.js';

// Función para eliminar todos los controladores de redimensionamiento de una ventana
export function removeResizeHandles(windowElement) {
  const existingHandles = windowElement.querySelectorAll('.resize-handle');
  existingHandles.forEach(handle => handle.remove());
}

// Función para hacer las ventanas redimensionables
export function makeWindowResizable(windowElement) {
  const windowId = Object.keys(windows).find(key => windows[key] === windowElement);

  // No hacer redimensionable si está minimizada o maximizada
  if (minimizedWindows[windowId] || maximizedWindows[windowId]) {
    removeResizeHandles(windowElement);
    return;
  }

  // Primero eliminar los controladores existentes para evitar duplicados
  removeResizeHandles(windowElement);

  // Crear los controladores de redimensionamiento
  const handles = [
    { class: 'resize-handle-e', direction: 'e' },
    { class: 'resize-handle-w', direction: 'w' },
    { class: 'resize-handle-n', direction: 'n' },
    { class: 'resize-handle-s', direction: 's' },
    { class: 'resize-handle-se', direction: 'se' },
    { class: 'resize-handle-sw', direction: 'sw' },
    { class: 'resize-handle-ne', direction: 'ne' },
    { class: 'resize-handle-nw', direction: 'nw' }
  ];

  // Crear y añadir los nuevos controladores
  handles.forEach(handle => {
    const resizeHandle = document.createElement('div');
    resizeHandle.className = `resize-handle ${handle.class}`;
    resizeHandle.addEventListener('mousedown', (e) => startResize(e, windowElement, handle.direction));
    windowElement.appendChild(resizeHandle);
  });
}

// Función para iniciar el redimensionamiento
function startResize(e, windowElement, direction) {
  e.preventDefault();
  e.stopPropagation();

  const windowId = Object.keys(windows).find(key => windows[key] === windowElement);

  // No permitir redimensionar si está minimizada o maximizada
  if (minimizedWindows[windowId] || maximizedWindows[windowId]) {
    return;
  }

  const rect = windowElement.getBoundingClientRect();
  const startX = e.clientX;
  const startY = e.clientY;
  const startWidth = rect.width;
  const startHeight = rect.height;
  const startTop = rect.top;
  const startLeft = rect.left;

  // Cambiar el cursor durante el redimensionamiento
  const originalCursor = document.body.style.cursor;
  switch (direction) {
    case 'e': case 'w': document.body.style.cursor = 'ew-resize'; break;
    case 'n': case 's': document.body.style.cursor = 'ns-resize'; break;
    case 'ne': case 'sw': document.body.style.cursor = 'nesw-resize'; break;
    case 'nw': case 'se': document.body.style.cursor = 'nwse-resize'; break;
  }

  // Desactivar transiciones durante el redimensionamiento
  windowElement.style.transition = 'none';

  // Establecer z-index alto para que la ventana esté al frente
  windowElement.style.zIndex = '110';

  // Función para manejar el redimensionamiento
  function resize(e) {
    const minWidth = 200;
    const minHeight = 150;

    let newWidth = startWidth;
    let newHeight = startHeight;
    let newTop = startTop;
    let newLeft = startLeft;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    // Redimensionar basado en la dirección
    if (direction.includes('e')) {
      newWidth = Math.max(startWidth + deltaX, minWidth);
    } else if (direction.includes('w')) {
      newWidth = Math.max(startWidth - deltaX, minWidth);
      if (newWidth !== minWidth) {
        newLeft = startLeft + deltaX;
      }
    }

    if (direction.includes('s')) {
      newHeight = Math.max(startHeight + deltaY, minHeight);
    } else if (direction.includes('n')) {
      newHeight = Math.max(startHeight - deltaY, minHeight);
      if (newHeight !== minHeight) {
        newTop = startTop + deltaY;
      }
    }

    // Aplicar los nuevos valores
    windowElement.style.width = `${newWidth}px`;
    windowElement.style.height = `${newHeight}px`;
    windowElement.style.top = `${newTop}px`;
    windowElement.style.left = `${newLeft}px`;
  }

  // Función para detener el redimensionamiento
  function stopResize() {
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);

    // Restaurar el cursor
    document.body.style.cursor = originalCursor;

    // Restaurar transiciones
    setTimeout(() => {
      windowElement.style.transition = 'all 0.8s ease-in-out';
    }, 100);
  }

  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup', stopResize);
}

// Función para actualizar la redimensionabilidad de las ventanas
export function updateWindowResizability() {
  Object.keys(windows).forEach(windowId => {
    const windowElement = windows[windowId];
    if (windowElement) {
      if (!minimizedWindows[windowId] && !maximizedWindows[windowId]) {
        makeWindowResizable(windowElement);
      } else {
        removeResizeHandles(windowElement);
      }
    }
  });
}