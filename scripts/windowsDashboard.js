// Variables para gestionar el estado de las ventanas
let visibleWindows = {}; // Inicializar vacío
let minimizedWindows = {}; // Inicializar vacío
let maximizedWindows = {}; // Inicializar vacío

// Referencias a las ventanas
const windows = {}; // Inicializar vacío. Se poblará dinámicamente.

// Inicializar el estado de "encima del mouse" para cada ventana
let isMouseOverWindowState = {}; // Inicializar vacío

// Variable global para isInitialState
if (typeof isInitialState === 'undefined') {
  // eslint-disable-next-line no-unused-vars
  var isInitialState = true;
}
// Variable global para menuPositions
if (typeof menuPositions === 'undefined') {
  // eslint-disable-next-line no-unused-vars
  var menuPositions = {};
}

// Función para eliminar todos los controladores de redimensionamiento de una ventana
function removeResizeHandles(windowElement) {
  const existingHandles = windowElement.querySelectorAll('.resize-handle');
  existingHandles.forEach(handle => handle.remove());
}

// Función para minimizar/restaurar ventanas (botón púrpura)
function toggleMinimize(windowId) {
  const windowElement = document.getElementById(windowId);
  // Asegurarse de que el estado de la ventana exista
  if (typeof minimizedWindows[windowId] === 'undefined') {
    minimizedWindows[windowId] = false; // Estado inicial por defecto si no existe
    maximizedWindows[windowId] = false; // Estado inicial por defecto si no existe
  }

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
          const position = menuPositions[windowId] || { top: '100px', left: '100px' }; // Fallback si no hay menuPosition
          windowElement.style.top = position.top + 'px';
          windowElement.style.left = position.left + 'px';
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
      if (!minimizedWindows[windowId] && !isInitialState) {
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
function toggleMaximize(windowId) {
  const windowElement = document.getElementById(windowId);
  // Asegurarse de que el estado de la ventana exista
  if (typeof minimizedWindows[windowId] === 'undefined') {
    minimizedWindows[windowId] = false; // Estado inicial por defecto si no existe
    maximizedWindows[windowId] = false; // Estado inicial por defecto si no existe
  }

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

// Función para hacer las ventanas arrastrables
function makeWindowDraggable(windowElement) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  let isDragging = false;
  const header = windowElement.querySelector('.window-header');

  // Usar el ID del elemento directamente
  const windowId = windowElement.id;

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
    Object.keys(windows).forEach(id => {
      const win = windows[id];
      if (win && id !== windowId) { // Comparar por ID
        // Asignar z-index basado en un orden o simplemente un valor menor
        win.style.zIndex = 100;
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
    if (minimizedWindows[windowId] && menuPositions[windowId]) {
      menuPositions[windowId].top = newTop;
      menuPositions[windowId].left = newLeft;
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

// Función para hacer las ventanas redimensionables
function makeWindowResizable(windowElement) {
  const windowId = windowElement.id;

  // No hacer redimensionable si está minimizada o maximizada
  if (minimizedWindows[windowId] === true || maximizedWindows[windowId] === true) {
    // Nos aseguramos de eliminar todos los controladores existentes
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

  const windowId = windowElement.id;

  // No permitir redimensionar si está minimizada o maximizada
  if (minimizedWindows[windowId] === true || maximizedWindows[windowId] === true) {
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
    const minWidth = 200;  // Ancho mínimo
    const minHeight = 150; // Altura mínima

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

    // Redimensionar gráfico de jobs si la ventana jobicyJobsWindow fue redimensionada
    if (windowElement.id === 'jobicyJobsWindow' && typeof window.resizeJobsChart === 'function') {
      setTimeout(() => {
        window.resizeJobsChart();
      }, 100);
    }

    // Restaurar transiciones
    setTimeout(() => {
      windowElement.style.transition = 'all 0.8s ease-in-out';
    }, 100);
  }

  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup', stopResize);
}

// Función para actualizar la redimensionabilidad de las ventanas
function updateWindowResizability() {
  Object.keys(windows).forEach(windowId => {
    const windowElement = document.getElementById(windowId); // Obtener por ID
    if (windowElement) {
      if (minimizedWindows[windowId] !== true && maximizedWindows[windowId] !== true) {
        makeWindowResizable(windowElement);
      } else {
        // Remover los controladores si la ventana está minimizada o maximizada
        removeResizeHandles(windowElement);
      }
    }
  });
}

// Inicializar o reiniciar todas las ventanas
function registerAndEnableWindowInteractions(windowElement, initialState = {}) {
  const windowId = windowElement.id;

  if (!windowId) {
    console.error("Elemento ventana no tiene ID, no se puede inicializar:", windowElement);
    return;
  }

  // Registrar la ventana y su estado inicial
  windows[windowId] = windowElement;
  minimizedWindows[windowId] = !!initialState.minimized;
  maximizedWindows[windowId] = !!initialState.maximized;
  isMouseOverWindowState[windowId] = false;
  visibleWindows[windowId] = true;

  // Hacer arrastrable
  makeWindowDraggable(windowElement);

  // Aplicar estado inicial y redimensionabilidad
  if (maximizedWindows[windowId]) {
    windowElement.classList.add('window-maximized');
    removeResizeHandles(windowElement);
  } else if (minimizedWindows[windowId]) {
    removeResizeHandles(windowElement);
  } else {
    // Solo hacer redimensionable si no está minimizada ni maximizada
    makeWindowResizable(windowElement);
  }
}