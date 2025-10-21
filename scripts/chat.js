
document.addEventListener('DOMContentLoaded', () => {
  const chatMessagesArea = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendChatButton = document.getElementById('sendChatButton');

  // URL de tu endpoint de backend para el chat
  const CHAT_API_URL = 'http://127.0.0.1:8000/api/v1/chat/send';

  // Fix for input functionality - ensure it's properly enabled
  if (chatInput) {
    // Force input properties
    chatInput.style.pointerEvents = 'auto';
    chatInput.style.userSelect = 'text';
    chatInput.style.webkitUserSelect = 'text';
    chatInput.removeAttribute('readonly');
    chatInput.removeAttribute('disabled');

    // Ensure input can receive focus
    chatInput.tabIndex = 0;

    // Add additional event listeners to ensure functionality
    chatInput.addEventListener('click', function (e) {
      e.stopPropagation();
      this.focus();
    });

    chatInput.addEventListener('mousedown', function (e) {
      e.stopPropagation();
    });
  }

  // Función para añadir un mensaje al área de chat
  function addMessageToChat(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message');
    messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');

    const messageParagraph = document.createElement('p');
    messageParagraph.textContent = message;
    messageDiv.appendChild(messageParagraph);

    chatMessagesArea.appendChild(messageDiv);
    // Hacer scroll para mostrar el último mensaje
    chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
  }

  // Función para enviar el mensaje al backend
  async function sendMessageToBackend(messageText) {
    try {
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Si tu API requiere autenticación (por ejemplo, un token JWT):
          // 'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) {
        let errorDetail = "No se pudo conectar con el asistente.";
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || errorDetail;
        } catch (e) {
          // No hacer nada si el cuerpo del error no es JSON
        }
        console.error('Error del backend:', response.status, errorDetail);
        addMessageToChat(`Error: ${errorDetail}`, 'bot');
        return;
      }

      const data = await response.json();
      addMessageToChat(data.response, 'bot');

    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      addMessageToChat('Hubo un problema al conectar con el asistente. Inténtalo de nuevo.', 'bot');
    }
  }

  // Manejar el envío del mensaje
  async function handleSendMessage() {
    const messageText = chatInput.value.trim();
    if (messageText === '') {
      return; // No enviar mensajes vacíos
    }

    addMessageToChat(messageText, 'user'); // Mostrar mensaje del usuario inmediatamente
    chatInput.value = ''; // Limpiar el campo de entrada
    chatInput.focus(); // Devolver el foco al input

    await sendMessageToBackend(messageText);
  }

  // Event listener para el botón de enviar
  if (sendChatButton) {
    sendChatButton.addEventListener('click', handleSendMessage);
  }

  // Event listener para la tecla "Enter" en el campo de entrada
  if (chatInput) {
    chatInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault(); // Evitar el comportamiento por defecto
        handleSendMessage();
      }
    });
  }

  console.log("Chat UI inicializado para Kusanagi.");
});