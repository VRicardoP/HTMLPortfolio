document.addEventListener('DOMContentLoaded', () => {
  const backendTrackUrl = 'http://127.0.0.1:8000/api/v1/analytics/track';

  // Datos a enviar (un objeto JSON vacío como espera el backend)
  const requestData = {};

  fetch(backendTrackUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData) // Convierte el objeto JS a una cadena JSON
  })
    .then(response => {
      if (!response.ok) {
        console.error('Error al trackear visitante. Status:', response.status);
        return response.json().then(errData => {
          console.error('Detalles del error:', errData);
          throw new Error(`Error del servidor: ${response.status}`);
        });
      }
      return response.json(); // Convierte la respuesta JSON del backend a un objeto JS
    })
    .then(data => {
      if (data.success) {
        console.log('Visita trackeada exitosamente. ID:', data.visitor_id);
      } else {
        console.warn('El tracking no fue exitoso (según la respuesta del backend):', data.message);
      }
    })
    .catch(error => {
      // Este catch maneja errores de red (ej. backend no disponible)
      // o errores lanzados en los .then() anteriores.
      console.error('Hubo un problema con la petición de tracking:', error);
    });
});
