document.addEventListener('DOMContentLoaded', () => {
  const backendBaseUrl = 'http://127.0.0.1:8000'; // URL de tu backend en la VM (accesible desde el host)
  const statsEndpoint = `${backendBaseUrl}/api/v1/analytics/stats?days=30`;
  const mapDataEndpoint = `${backendBaseUrl}/api/v1/analytics/map-data`;

  // --- Función de Fetch Autenticado ---
  async function fetchAuthenticated(url, options = {}) {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      console.error('No access token found. Redirecting to login.');
      alert('No estás autenticado. Redirigiendo a login...'); // Fallback simple
      window.location.href = 'login.html';
      throw new Error('Not authenticated: No token found.');
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (response.status === 401) { // Unauthorized
        localStorage.removeItem('accessToken');
        localStorage.removeItem('tokenType');
        alert('Tu sesión ha expirado. Redirigiendo a login...');
        window.location.href = 'login.html';
        throw new Error('Session expired or invalid.');
      }
      return response;
    } catch (error) {
      console.error("Fetch authenticated error:", error);
      if (!error.message.includes('Session expired') && !error.message.includes('No token found')) {
        alert(`Error de red o conexión: ${error.message}`);
      }
      throw error; // Re-throw para ser manejado por la función que llama
    }
  }

  // --- Funciones para actualizar el DOM ---
  function updateTotalVisitors(count) {
    document.getElementById('total-visitors').textContent = count;
  }

  function updateUniqueCountries(count) {
    document.getElementById('unique-countries').textContent = count;
  }

  function updateUniqueCities(count) {
    document.getElementById('unique-cities').textContent = count;
  }

  function updateTopList(listId, items, itemKey, countKey) {
    const ulElement = document.getElementById(listId);
    ulElement.innerHTML = ''; // Limpiar "Cargando..."
    if (items && items.length > 0) {
      items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item[itemKey]}: ${item[countKey]}`;
        ulElement.appendChild(li);
      });
    } else {
      ulElement.innerHTML = '<li>No hay datos disponibles.</li>';
    }
  }

  function updateRecentVisitorsTable(visitors) {
    const tbody = document.querySelector('#recent-visitors-table tbody');
    tbody.innerHTML = ''; // Limpiar "Cargando..."
    if (visitors && visitors.length > 0) {
      visitors.forEach(visitor => {
        const row = tbody.insertRow();
        row.insertCell().textContent = new Date(visitor.timestamp).toLocaleString();
        row.insertCell().textContent = visitor.country || 'N/A';
        row.insertCell().textContent = visitor.city || 'N/A';
        row.insertCell().textContent = visitor.ip_address || 'N/A';
        row.insertCell().textContent = visitor.user_agent || 'N/A';
      });
    } else {
      const row = tbody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 5;
      cell.textContent = 'No hay visitantes recientes.';
    }
  }

  // --- Obtener y mostrar estadísticas (usando fetchAuthenticated) ---
  fetchAuthenticated(statsEndpoint)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error HTTP al obtener estadísticas: ${response.status}`);
      }
      return response.json();
    })
    .then(statsData => {
      console.log("Estadísticas recibidas:", statsData);
      updateTotalVisitors(statsData.total_visitors);
      updateUniqueCountries(statsData.unique_countries);
      updateUniqueCities(statsData.unique_cities);
      updateTopList('top-countries-list', statsData.top_countries, 'country', 'count');
      updateTopList('top-cities-list', statsData.top_cities, 'city', 'count');
      updateRecentVisitorsTable(statsData.recent_visitors);
    })
    .catch(error => {
      console.error('Error al cargar las estadísticas:', error);
      // Mostrar error en la UI si es necesario
      document.getElementById('total-visitors-card').innerHTML = '<h3>Error al cargar datos</h3>';
    });

  // --- Lógica para el mapa ---

  const mapContainer = document.getElementById('map-container'); // div donde se renderizará el mapa
  let map; // Variable global para almacenar la instancia del mapa

  async function loadAndRenderMapClientSide() {

    if (!mapContainer) {
      console.error("Map container div ('map-container') not found.");
      return;
    }

    // Mostrar mensaje de carga
    mapContainer.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100%; font-size: 16px; color: #666;">Cargando mapa...</div>';

    try {
      const response = await fetchAuthenticated(mapDataEndpoint);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(`Error ${response.status}: ${errorData.detail}`);
      }
      const mapDataPoints = await response.json();

      // Verificar que Leaflet esté disponible
      if (typeof L === 'undefined') {
        mapContainer.innerHTML = '<div style="color: red; padding: 20px; text-align: center;">Error: Librería Leaflet no cargada. Asegúrate de incluir Leaflet.js en dashboard.html.</div>';
        console.error("Leaflet (L) is not defined. Make sure to include Leaflet.js in your HTML.");
        return;
      }

      // Limpiar el contenedor antes de crear el mapa
      mapContainer.innerHTML = '';

      // Destruir mapa anterior si existe
      if (map) {
        map.off(); // Remover event listeners
        map.remove();
        map = null;
      }

      // ESPERAR UN MOMENTO para que el DOM se actualice completamente
      await new Promise(resolve => setTimeout(resolve, 100));

      if (mapDataPoints && mapDataPoints.length > 0) {
        // Configurar vista inicial del mapa basada en el primer punto o centrado mundial
        const initialLat = mapDataPoints[0].latitude || 20;
        const initialLng = mapDataPoints[0].longitude || 0;
        const initialZoom = mapDataPoints.length === 1 ? 10 : 2; // Zoom más cercano si solo hay un punto

        // Crear el mapa
        map = L.map(mapContainer, {
          center: [initialLat, initialLng],
          zoom: initialZoom,
          zoomControl: true,
          attributionControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          keyboard: true,
          dragging: true,
          touchZoom: true,
          // Configuración para evitar el problema de repetición
          worldCopyJump: false,
          maxBounds: [[-90, -180], [90, 180]], // Limitar el mundo a una sola copia
          maxBoundsViscosity: 1.0
        });

        // Añadir capa de tiles de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
          minZoom: 1,
          // Evitar que se carguen tiles fuera de los límites del mundo
          bounds: [[-90, -180], [90, 180]],
          // Configuración para mejor rendimiento
          keepBuffer: 2,
          updateWhenZooming: false,
          updateWhenIdle: true
        }).addTo(map);

        // FORZAR redimensionamiento después de crear el mapa
        setTimeout(() => {
          if (map) {
            map.invalidateSize(true);
            // Inicializar observers después de crear el mapa
            initializeAllObservers();
          }
        }, 200);

        // Crear grupo de marcadores para mejor rendimiento
        const markersGroup = L.layerGroup().addTo(map);

        // Añadir marcadores para cada punto de datos
        mapDataPoints.forEach(point => {
          if (point.latitude && point.longitude) {
            const marker = L.marker([point.latitude, point.longitude])
              .bindPopup(`
                <div>
                  <strong>${point.city || 'Ciudad desconocida'}</strong><br>
                  <em>${point.country || 'País desconocido'}</em><br>
                  <small>IP: ${point.ip_address || 'N/A'}</small><br>
                  <small>Fecha: ${point.timestamp ? new Date(point.timestamp).toLocaleString() : 'N/A'}</small>
                </div>
              `);
            markersGroup.addLayer(marker);
          }
        });

        // Ajustar la vista para mostrar todos los marcadores si hay múltiples puntos
        if (mapDataPoints.length > 1) {
          setTimeout(() => {
            const group = new L.featureGroup(markersGroup.getLayers());
            if (group.getBounds().isValid()) {
              map.fitBounds(group.getBounds(), {
                padding: [20, 20],
                maxZoom: 10
              });
            }
          }, 300);
        }

        console.log(`Mapa cargado exitosamente con ${mapDataPoints.length} puntos.`);
      } else {
        // No hay datos para mostrar - crear mapa vacío centrado en el mundo
        map = L.map(mapContainer, {
          center: [20, 0],
          zoom: 2,
          worldCopyJump: false,
          maxBounds: [[-90, -180], [90, 180]],
          maxBoundsViscosity: 1.0
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
          minZoom: 1,
          bounds: [[-90, -180], [90, 180]]
        }).addTo(map);

        setTimeout(() => {
          if (map) {
            map.invalidateSize(true);
            // Inicializar observers para mapa sin datos
            initializeAllObservers();
          }
        }, 200);

        // Mostrar mensaje en el mapa
        const noDataDiv = L.control({ position: 'topleft' });
        noDataDiv.onAdd = function () {
          const div = L.DomUtil.create('div', 'no-data-message');
          div.innerHTML = '<div style="background: rgba(255,255,255,0.9); padding: 10px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">No hay datos de geolocalización para mostrar</div>';
          return div;
        };
        noDataDiv.addTo(map);
      }
    } catch (error) {
      console.error('Error al cargar datos del mapa:', error);
      mapContainer.innerHTML = `<div style="color: red; padding: 20px; text-align: center;">
        <strong>Error al cargar el mapa:</strong><br>
        ${error.message}
      </div>`;
    }
  }

  // Redimensionar mapa cuando la ventana cambie de tamaño
  function resizeMap() {
    if (map && mapContainer) {
      // Esperar un poco para que el DOM se actualice
      setTimeout(() => {
        // Obtener las dimensiones actuales del contenedor
        const containerRect = mapContainer.getBoundingClientRect();
        console.log(`Redimensionando mapa: ${containerRect.width}x${containerRect.height}`);

        // Forzar invalidación del tamaño
        map.invalidateSize({
          animate: false,
          pan: false
        });

        // Segunda invalidación para asegurar el redimensionamiento
        setTimeout(() => {
          map.invalidateSize(true);
        }, 50);

        console.log('Mapa redimensionado');
      }, 100);
    }
  }

  // Refrescar mapa (útil para actualizaciones periódicas)
  function refreshMap() {
    console.log('Refrescando datos del mapa...');
    loadAndRenderMapClientSide();
  }

  // Event listeners para redimensionamiento mejorados
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeMap, 150);
  });

  // Observer para detectar cambios de tamaño en el contenedor del mapa
  let mapResizeObserver;

  function initializeMapResizeObserver() {
    if (window.ResizeObserver && mapContainer && !mapResizeObserver) {
      mapResizeObserver = new ResizeObserver((entries) => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (map) {
            const entry = entries[0];
            if (entry) {
              const { width, height } = entry.contentRect;
              console.log(`ResizeObserver detectó cambio: ${width}x${height}`);

              // Forzar redimensionamiento del mapa
              map.invalidateSize({
                animate: false,
                pan: false
              });

              // Segunda invalidación para casos problemáticos
              setTimeout(() => {
                map.invalidateSize(true);
              }, 100);
            }
          }
        }, 100);
      });

      mapResizeObserver.observe(mapContainer);
      console.log('ResizeObserver inicializado para el mapa');
    }
  }

  // Observer adicional para la ventana del mapa
  let windowResizeObserver;

  function initializeWindowResizeObserver() {
    const mapWindow = document.getElementById('mapWindow');
    if (window.ResizeObserver && mapWindow && !windowResizeObserver) {
      windowResizeObserver = new ResizeObserver((entries) => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (map) {
            console.log('Ventana del mapa redimensionada');
            resizeMap();
          }
        }, 150);
      });

      windowResizeObserver.observe(mapWindow);
      console.log('ResizeObserver inicializado para la ventana del mapa');
    }
  }

  // Función para inicializar todos los observers
  function initializeAllObservers() {
    setTimeout(() => {
      initializeMapResizeObserver();
      initializeWindowResizeObserver();
    }, 1000);
  }

  // Para funciones de maximizar/minimizar ventanas, también redimensiona el mapa
  window.addEventListener('mapWindowResized', resizeMap);

  // Event listener personalizado para cuando se redimensiona manualmente la ventana
  window.addEventListener('windowResized', (event) => {
    if (event.detail && event.detail.windowId === 'mapWindow') {
      setTimeout(resizeMap, 200);
    }
  });

  // --- INICIALIZACIÓN AL CARGAR LA PÁGINA ---
  const token = localStorage.getItem('accessToken');
  if (!token) {
    alert('No estás autenticado. Serás redirigido a la página de login.');
    window.location.href = 'login.html';
  } else {
    loadAndRenderMapClientSide();

    // OPCIONAL: Refrescar el mapa cada 5 minutos para datos actualizados
    // setInterval(refreshMap, 5 * 60 * 1000);
  }

  // --- FUNCIONES ADICIONALES PARA INTEGRACIÓN CON CONTROLES DE VENTANA ---

  // Para funciones maximizar/minimizar, exportar la función de redimensionamiento
  window.resizeVisitorMap = resizeMap;
  window.refreshVisitorMap = refreshMap;
});