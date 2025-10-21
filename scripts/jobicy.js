// Configuración del backend
const BACKEND_URL = "http://127.0.0.1:8000";
// Ajuste: Asumimos que necesitas un endpoint específico bajo la nueva ruta base.
// Si el endpoint /api/v1/jobicy-jobs directamente sirve los datos por país, este cambio no sería necesario.
const JOBS_API_ENDPOINT = `${BACKEND_URL}/api/v1/jobicy-jobs/tech-jobs-by-country`;
// Variables globales para el gráfico
let jobsChart = null;

async function fetchJobData() {
  const token = localStorage.getItem('accessToken');
  const canvas = document.getElementById("jobicyJobsChart");

  if (!token) {
    console.error('No access token found for Jobicy jobs. Please log in.');
    if (canvas) {
      displayError("No autorizado. Inicie sesión para ver los empleos de Jobicy.", canvas.getContext('2d'));
    }
    return;
  }

  try {
    console.log("Fetching job data from:", JOBS_API_ENDPOINT);

    const response = await fetch(JOBS_API_ENDPOINT, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('tokenType');
        if (canvas) displayError("Sesión expirada. Redirigiendo a login...", canvas.getContext('2d'));
        setTimeout(() => window.location.href = 'login.html', 2000);
        throw new Error('Session expired or invalid.');
      }
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log("Raw response data:", responseData);

    // Extraer datos y metadata según la estructura proporcionada
    // data: { "Country1": count1, "Country2": count2, ... }
    // metadata: { ... }
    const jobDataByCountry = responseData.data || {};
    const metadata = responseData.metadata || null;

    console.log("Extracted job data by country:", jobDataByCountry);
    console.log("Extracted metadata:", metadata);

    // Mostrar los datos en el gráfico de la ventana
    displayJobsChart(jobDataByCountry, metadata);

  } catch (error) {
    console.error("Error al obtener datos de empleos:", error);
    if (canvas && !error.message.includes('Session expired')) displayError(error.message, canvas.getContext('2d'));
  }
}

function displayJobsChart(jobDataByCountry, metadata) { // jobDataByCountry es el responseData.data
  const canvas = document.getElementById("jobicyJobsChart");

  if (!canvas) {
    console.warn("Canvas 'jobicyJobsChart' no encontrado en el DOM.");
    return;
  }
  // Caso 1: El objeto 'data' del backend está vacío o no es un objeto.
  if (typeof jobDataByCountry !== 'object' || Object.keys(jobDataByCountry).length === 0) {
    displayNoDataMessage(canvas, metadata, 'data_empty'); // Nuevo argumento 'reason'
    return;
  }

  // Si el canvas estaba oculto por "no data" o "error", mostrarlo
  canvas.style.display = 'block';
  const container = canvas.parentElement;
  const noDataMsg = container.querySelector('.no-data-message');
  if (noDataMsg) noDataMsg.remove();
  const errorMsg = container.querySelector('.error-message');
  if (errorMsg) errorMsg.remove();

  // Preparar datos para Chart.js: países y sus conteos
  // Filtrar para mostrar solo los top N o aquellos con conteo > 0 si es necesario
  const sortedCountryData = Object.entries(jobDataByCountry)
    .sort(([, a], [, b]) => b - a) // Ordenar por número de trabajos descendente
    .filter(([, count]) => count > 0) // Opcional: filtrar países sin trabajos
    .slice(0, 15); // Mostrar solo los top 15 países, por ejemplo

  // Caso 2: El objeto 'data' tenía entradas, pero todas fueron filtradas (ej. conteo 0)
  if (sortedCountryData.length === 0) {
    displayNoDataMessage(canvas, metadata, 'all_filtered_zero'); // Nuevo argumento 'reason'
    return;
  }
  const labels = sortedCountryData.map(([country]) => country);
  const counts = sortedCountryData.map(([, count]) => count);

  // Destruir gráfico anterior si existe
  if (jobsChart) {
    jobsChart.destroy();
  }

  // Crear nuevo gráfico
  const ctx = canvas.getContext('2d');

  jobsChart = new Chart(ctx, {
    type: 'horizontalBar', // Gráfico de barras horizontales para países
    data: {
      labels: labels,
      datasets: [{
        label: 'Ofertas de Empleo por País',
        data: counts,
        backgroundColor: generateColors(labels.length),
        borderColor: '#ffffff',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 10
        }
      },
      scales: {
        xAxes: [{
          ticks: {
            beginAtZero: true,
            stepSize: Math.ceil(Math.max(...counts) / 10) || 1, // Ajustar stepSize dinámicamente
            fontSize: 10
          }
        }],
        yAxes: [{
          ticks: {
            fontSize: 10
          }
        }]
      },
      legend: {
        display: false // Puede ser redundante si el título es claro
      },
      title: {
        display: true,
        text: `Empleos Remotos por País (Jobicy)${metadata && metadata.total_jobs ? ` - ${metadata.total_jobs} total` : ''}`,
        fontSize: 14,
        fontColor: '#333'
      },
      tooltips: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFontSize: 12,
        bodyFontSize: 11,
        callbacks: {
          label: function (tooltipItem, data) {
            const dataset = data.datasets[tooltipItem.datasetIndex];
            const currentValue = dataset.data[tooltipItem.index];
            const total = dataset.data.reduce((sum, value) => sum + value, 0);
            const percentage = total > 0 ? ((currentValue / total) * 100).toFixed(1) : '0';
            return `${data.labels[tooltipItem.index]}: ${currentValue} ofertas (${percentage}%)`;
          }
        }
      },
      plugins: {
        datalabels: {
          display: false
        }
      }
    }
  });

  console.log(`Gráfico de Jobicy creado con ${labels.length} países.`);

  // Actualizar título de la ventana si hay metadata
  if (metadata) {
    updateWindowTitle(metadata);
  }
}

function displayNoDataMessage(canvas, metadata, reason) {
  if (!canvas) return;
  // Ocultar canvas y mostrar mensaje
  canvas.style.display = 'none';

  const container = canvas.parentElement;
  if (!container) return;

  // Limpiar mensajes previos de error
  const errorMsg = container.querySelector('.error-message');
  if (errorMsg) errorMsg.remove();
  let messageDiv = container.querySelector('.no-data-message');
  if (!messageDiv) {
    messageDiv = document.createElement('div');
    messageDiv.className = 'no-data-message';
    container.appendChild(messageDiv);
  }

  let message = '<div style="text-align: center; padding: 40px; color: #666;">';

  if (metadata && metadata.update_in_progress) {
    message += `
      <div style="font-size: 18px; color: #007bff;">🔄</div>
      <h3>Actualizando datos...</h3>
      <p>El sistema está obteniendo los últimos empleos de Jobicy.</p>
      <p><small>Esto puede tomar unos minutos.</small></p>
      <button onclick="setTimeout(fetchJobData, 5000)" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Verificar de nuevo
      </button>
    `;
  } else if (metadata && metadata.hasOwnProperty('total_jobs') && metadata.total_jobs === 0) {
    message += `
      <div style="font-size: 18px;">📭</div>
      <h3>No hay empleos en Jobicy</h3>
      <p>El sistema confirma que no hay ofertas de Jobicy disponibles actualmente.</p>
      <p><small>Última actualización: ${metadata.last_updated || 'Nunca'}</small></p>
      ${metadata.last_error ? `<p><small style="color: #dc3545;">Error: ${metadata.last_error}</small></p>` : ''}
      <button onclick="forceRefresh()" style="margin-top: 10px; padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Forzar Actualización de Jobicy
      </button>
    `;
  } else if (reason === 'data_empty') { // El objeto data vino vacío del backend
    message += `
      <div style="font-size: 18px;">🤔</div>
      <h3>Datos de Jobicy no encontrados</h3>
      <p>El listado de empleos por país de Jobicy está vacío en la respuesta del backend.</p>
      ${metadata && metadata.hasOwnProperty('total_jobs') ? `<p><small>Total de trabajos reportados en metadatos: ${metadata.total_jobs}</small></p>` : ''}
      <p><small>Última actualización: ${metadata ? metadata.last_updated || 'Nunca' : 'N/A'}</small></p>
      ${metadata && metadata.last_error ? `<p><small style="color: #dc3545;">Último error del backend: ${metadata.last_error}</small></p>` : ''}
      <button onclick="fetchJobData()" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Reintentar Carga
      </button>
      <button onclick="forceRefresh()" style="margin-top: 10px; padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Forzar Actualización de Jobicy
      </button>
    `;
  } else if (reason === 'all_filtered_zero') { // Data tenía países, pero todos con 0 ofertas activas
    message += `
      <div style="font-size: 18px;">∅</div>
      <h3>No hay ofertas activas en Jobicy</h3>
      <p>Aunque se listan países/categorías, no tienen ofertas de Jobicy en este momento.</p>
       <p><small>Última actualización: ${metadata ? metadata.last_updated || 'Nunca' : 'N/A'}</small></p>
      ${metadata && metadata.hasOwnProperty('total_jobs') ? `<p><small>Total de trabajos reportados en metadatos: ${metadata.total_jobs}</small></p>` : ''}
      <button onclick="fetchJobData()" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Reintentar Carga
      </button>
       <button onclick="forceRefresh()" style="margin-top: 10px; padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Forzar Actualización de Jobicy
      </button>
    `;
  } else { // Fallback genérico, debería ser menos común con los 'reason'
    message += `
      <div style="font-size: 18px;">❓</div>
      <h3>Situación inesperada con datos de Jobicy</h3>
      <p>No se pudieron mostrar los empleos. Verifique la consola para más detalles.</p>
      <button onclick="fetchJobData()" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Reintentar
      </button>
    `;
  }
  message += '</div>';
  messageDiv.innerHTML = message;
}

function displayError(errorMessage, ctx) { // ctx es opcional, usado si el canvas no está disponible globalmente
  let canvas = document.getElementById("jobicyJobsChart");
  let context = ctx;

  if (!canvas && !context) {
    console.error("No canvas or context to display error message for Jobicy.");
    return;
  }
  if (canvas) context = canvas.getContext('2d');

  canvas.style.display = 'none';
  const container = canvas.parentElement;
  if (!container) return;

  // Limpiar mensajes previos de "no data"
  const noDataMsg = container.querySelector('.no-data-message');
  if (noDataMsg) noDataMsg.remove();
  let errorDiv = container.querySelector('.error-message');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    container.appendChild(errorDiv);
  }
  errorDiv.innerHTML = `
    <div style="text-align: center; padding: 40px; color: #dc3545;">
      <div style="font-size: 18px;">⚠️</div>
      <h3>Error de conexión</h3>
      <p>No se pudieron cargar los datos de empleos.</p>
      <p><small>${errorMessage}</small></p>
      <p><small>Verifica que el backend esté funcionando en ${BACKEND_URL}</small></p>
      <button onclick="fetchJobData()" style="margin-top: 10px; padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Reintentar
      </button>
    </div>
  `;
}

function generateColors(count) {
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
    '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
  ];

  return colors.slice(0, count);
}

function updateWindowTitle(metadata) {
  const windowTitle = document.querySelector('#jobicyJobsWindow .window-title');
  if (windowTitle && metadata) {
    const totalJobs = metadata.total_jobs || 0;
    const lastUpdated = metadata.last_updated || 'N/A';
    windowTitle.textContent = `Empleos Jobicy (${totalJobs} ofertas)`; // O "Empleos Remotos (Jobicy)"
    windowTitle.title = `Última actualización: ${lastUpdated}`;
  }
}

async function forceRefresh() {
  try {
    console.log("Forzando actualización del cache...");

    const canvas = document.getElementById("jobicyJobsChart");
    if (canvas) {
      // Limpiar mensajes previos de error o no data
      const existingErrorMsg = canvas.parentElement.querySelector('.error-message');
      if (existingErrorMsg) existingErrorMsg.remove();
      canvas.style.display = 'none';
      const container = canvas.parentElement;

      let refreshDiv = container.querySelector('.refresh-message');
      if (!refreshDiv) {
        refreshDiv = document.createElement('div');
        refreshDiv.className = 'refresh-message';
        container.appendChild(refreshDiv);
      }

      refreshDiv.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #0c5460;">
          <div style="font-size: 18px;">🔄</div>
          <h3>Actualizando cache...</h3>
          <p>Obteniendo los datos más recientes.</p>
          <p><small>Esto puede tomar 2-3 minutos.</small></p>
        </div>
      `;
    }

    // Asumimos que la ruta de refresh para jobicy podría ser específica
    // Si no, el backend debería manejar /api/v1/jobs/refresh-cache para todas las fuentes o tener rutas dedicadas
    const refreshEndpoint = `${BACKEND_URL}/api/v1/jobicy-jobs/refresh-cache`; // O la ruta genérica si aplica
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error("No autorizado para forzar refresh.");
    }
    const response = await fetch(refreshEndpoint, { method: 'POST' });

    if (response.ok) {
      const result = await response.json();
      console.log("Refresh response:", result);

      // Esperar y luego verificar los datos actualizados
      setTimeout(() => {
        fetchJobData();
      }, 5000);

    } else {
      const errorData = await response.json().catch(() => ({ detail: `Error HTTP ${response.status}` }));
      throw new Error(errorData.detail || `Error al forzar actualización: ${response.status}`);
    }

  } catch (error) {
    console.error("Error al forzar actualización:", error);
    const canvas = document.getElementById("jobicyJobsChart");
    if (canvas) {
      displayError(`Error al actualizar: ${error.message}`, canvas.getContext('2d'));
    }
  }
}

async function checkAPIStatus() {
  try {
    // Asumimos que la ruta de health para jobicy podría ser específica
    // O usar una genérica si el backend la provee
    const healthEndpoint = `${BACKEND_URL}/api/v1/jobicy-jobs/health`;
    const response = await fetch(healthEndpoint);

    if (response.ok) {
      const health = await response.json();
      console.log("API Health:", health);
      return health;
    }
  } catch (error) {
    console.error("Error checking API health:", error);
  }
  return null;
}

async function testBackendConnection() {
  try {
    console.log("Testing backend connection...");
    const testEndpoint = `${BACKEND_URL}/health`;
    const response = await fetch(testEndpoint);

    if (response.ok) {
      const result = await response.json();
      console.log("Backend connection test successful:", result);
      return true;
    } else {
      console.error("Backend connection test failed:", response.status);
      return false;
    }
  } catch (error) {
    console.error("Backend connection error:", error);
    return false;
  }
}

async function initializeJobsChart() {
  console.log("Initializing jobs chart...");

  // Verificar que Chart.js esté disponible
  if (typeof Chart === 'undefined') {
    console.error("Chart.js no está disponible. Asegúrate de incluir la librería.");
    const canvas = document.getElementById("jobicyJobsChart");
    if (canvas) displayError("Chart.js no está disponible.", canvas.getContext('2d'));
    return;
  }

  // Verificar conexión con backend
  const backendOk = await testBackendConnection();
  if (!backendOk) {
    const canvas = document.getElementById("jobicyJobsChart");
    if (canvas) displayError("No se puede conectar con el backend.", canvas.getContext('2d'));
    return;
  }

  // Verificar estado de la API
  const apiHealth = await checkAPIStatus();
  if (apiHealth) {
    console.log("Jobs API Status:", apiHealth.status);
  }

  // Obtener y mostrar datos
  await fetchJobData();
}

// Función para limpiar recursos al cerrar la ventana
function cleanupJobsChart() {
  if (jobsChart) {
    jobsChart.destroy();
    jobsChart = null;
  }
}

// Función pública para inicializar desde el HTML principal
window.initializeJobsChart = initializeJobsChart;
window.fetchJobData = fetchJobData;
window.forceRefresh = forceRefresh;
window.cleanupJobsChart = cleanupJobsChart;

// Auto-inicialización si el DOM ya está listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeJobsChart);
} else {
  // DOM ya está listo
  setTimeout(initializeJobsChart, 100);
}

// Función para redimensionar el gráfico cuando cambie el tamaño de la ventana
function resizeJobsChart() {
  if (jobsChart) {
    // Forzar el redimensionamiento del gráfico
    jobsChart.resize();

    // Si es necesario, también puedes actualizar las opciones
    const canvas = document.getElementById("jobicyJobsChart");
    if (canvas) {
      const container = canvas.parentElement;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Ajustar el canvas al contenedor
      canvas.style.width = (containerWidth - 20) + 'px';
      canvas.style.height = Math.max(300, containerHeight - 40) + 'px';
    }
  }
}

// Exponer la función globalmente
window.resizeJobsChart = resizeJobsChart;

// Limpiar al salir de la página
window.addEventListener('beforeunload', cleanupJobsChart);