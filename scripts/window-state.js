// Variables para gestionar el estado de las ventanas
export let visibleWindows = {
  'profileWindow': true,
  'softSkillsWindow': true,
  'educationWindow': true,
  'experienceWindow': true,
  'languagesWindow': true,
  'techSkillsWindow': true,
  'portfolioWindow': true,
  'contactWindow': true,
  'chatWindow': true
};

export let minimizedWindows = {
  'profileWindow': false,
  'softSkillsWindow': false,
  'educationWindow': false,
  'experienceWindow': false,
  'languagesWindow': false,
  'techSkillsWindow': false,
  'portfolioWindow': false,
  'contactWindow': false,
  'chatWindow': false
};

export let maximizedWindows = {
  'profileWindow': false,
  'softSkillsWindow': false,
  'educationWindow': false,
  'experienceWindow': false,
  'languagesWindow': false,
  'techSkillsWindow': false,
  'portfolioWindow': false,
  'contactWindow': false,
  'chatWindow': false
};

// Referencias a las ventanas (se inicializan cuando el DOM esté listo)
export let windows = {};

// Función para inicializar las referencias DOM
export function initializeWindowReferences() {
  windows.profileWindow = document.getElementById('profileWindow');
  windows.softSkillsWindow = document.getElementById('softSkillsWindow');
  windows.educationWindow = document.getElementById('educationWindow');
  windows.experienceWindow = document.getElementById('experienceWindow');
  windows.languagesWindow = document.getElementById('languagesWindow');
  windows.techSkillsWindow = document.getElementById('techSkillsWindow');
  windows.portfolioWindow = document.getElementById('portfolioWindow');
  windows.contactWindow = document.getElementById('contactWindow');
  windows.chatWindow = document.getElementById('chatWindow');
}

// Inicializar el estado de "encima del mouse" para cada ventana
export let isMouseOverWindowState = {
  'profileWindow': false,
  'softSkillsWindow': false,
  'educationWindow': false,
  'experienceWindow': false,
  'languagesWindow': false,
  'techSkillsWindow': false,
  'portfolioWindow': false,
  'contactWindow': false,
  'chatWindow': false
};