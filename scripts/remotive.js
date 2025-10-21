document.addEventListener('DOMContentLoaded', () => {
  // Asegurarse que el canvas exista antes de intentar cargar datos
  if (document.getElementById('remotiveJobsChart')) {
    loadRemotiveJobsData();
  } else {
    console.log("El canvas para Remotive no está presente. No se cargarán los datos.");
  }
});

async function loadRemotiveJobsData() {
  const BACKEND_URL = "http://127.0.0.1:8000"; // Añadir la URL base del backend
  // Ajuste: Cambiar al endpoint que devuelve trabajos agrupados por tag para más detalle.
  const REMOTIVE_API_ENDPOINT = `${BACKEND_URL}/api/v1/remotive-jobs/by-tag`;
  const token = localStorage.getItem('accessToken');
  const chartCanvas = document.getElementById('remotiveJobsChart');

  if (!chartCanvas) {
    console.error('Canvas element for Remotive jobs not found.');
    return;
  }
  const ctx = chartCanvas.getContext('2d');

  if (!token) {
    console.error('No access token found. Please log in.');
    ctx.font = "14px Arial";
    ctx.fillStyle = "red";
    ctx.textAlign = "center";
    ctx.fillText("Error: No autorizado. Inicie sesión.", chartCanvas.width / 2, chartCanvas.height / 2);
    return;
  }

  try {
    const response = await fetch(REMOTIVE_API_ENDPOINT, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      // Manejo específico para 401 Unauthorized
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('tokenType');
        ctx.font = "14px Arial";
        ctx.fillStyle = "red";
        ctx.textAlign = "center";
        ctx.fillText("Sesión expirada. Redirigiendo a login...", chartCanvas.width / 2, chartCanvas.height / 2);
        setTimeout(() => window.location.href = 'login.html', 2000);
        throw new Error('Session expired or invalid.');
      }
      // Intentar obtener detalles del error del cuerpo de la respuesta
      const errorText = await response.text(); // Obtener como texto primero
      let errorDetail = `Error HTTP: ${response.status} - ${response.statusText}`;
      try {
        const errorData = JSON.parse(errorText); // Intentar parsear como JSON
        errorDetail = errorData.detail || errorDetail;
      } catch (e) {
        // Si no es JSON, usar el texto del error si existe, o el statusText
        if (errorText) errorDetail = errorText;
      }
      throw new Error(errorDetail);
    }

    const apiResponse = await response.json();
    // Remotive API usualmente devuelve un objeto con una propiedad "jobs" que es un array.
    // Para el endpoint /by-category, esperamos que apiResponse.data sea un objeto
    // con categorías/tags como claves y conteos como valores: e.g., { "Tag1": count1, "Tag2": count2 }
    const aggregationData = apiResponse.data; // Renombrado de categoryData a aggregationData
    const metadata = apiResponse.metadata; // Opcional, para logs o títulos

    console.log("Remotive API response data (by tag):", aggregationData);
    console.log("Remotive API metadata:", metadata);

    // Verificar si aggregationData es un objeto y tiene al menos una entrada
    if (aggregationData && typeof aggregationData === 'object' && Object.keys(aggregationData).length > 0) {
      renderRemotiveJobsChart(aggregationData, ctx);
    } else {
      ctx.font = "14px Arial";
      ctx.fillStyle = "orange"; // Usar un color diferente para "no data" vs "error"
      ctx.textAlign = "center";
      ctx.fillText("No se encontraron ofertas de Remotive.", chartCanvas.width / 2, chartCanvas.height / 2);
      console.log('No hay datos de Remotive por tag para mostrar o el objeto de datos está vacío.');
    }

  } catch (error) {
    console.error('Error fetching or processing Remotive jobs:', error);
    if (!error.message.includes('Session expired')) { // No mostrar doble error si ya se manejó la expiración
      ctx.font = "12px Arial";
      ctx.fillStyle = "red";
      ctx.textAlign = "center";
      ctx.fillText(`Error cargando datos de Remotive: ${error.message}`, chartCanvas.width / 2, chartCanvas.height / 2, chartCanvas.width - 20);
    }
  }
}

function renderRemotiveJobsChart(aggregationData, ctx) { // Renombrado de categoryData a aggregationData
  // aggregationData es un objeto como { "Tag1": conteo1, "Tag2": conteo2 }
  // No es necesario el .reduce() si el backend ya proveyó los datos agregados.
  const labels = Object.keys(aggregationData);
  const dataPoints = Object.values(aggregationData);

  console.log("Rendering Remotive chart with labels:", labels, "and dataPoints:", dataPoints);

  if (window.remotiveChartInstance) {
    window.remotiveChartInstance.destroy();
  }

  window.remotiveChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Número de Ofertas por Tag (Remotive)', // Etiqueta del gráfico actualizada
        data: dataPoints,
        backgroundColor: 'rgba(75, 192, 192, 0.5)', // Teal color
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: Math.max(1, Math.ceil(Math.max(...dataPoints) / 10)) } } } }
  });
}