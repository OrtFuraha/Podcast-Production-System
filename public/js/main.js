// Podcast Production System - Main JavaScript

// Toast notification system
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) {
    const newContainer = document.createElement('div');
    newContainer.id = 'toast-container';
    newContainer.className = 'toast-container';
    document.body.appendChild(newContainer);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  document.getElementById('toast-container').appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 5000);
}

// Form validation helper
function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return true;
  
  const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
  let isValid = true;
  
  inputs.forEach(input => {
    if (!input.value.trim()) {
      input.style.borderColor = '#DC2626';
      isValid = false;
    } else {
      input.style.borderColor = '#E5E7EB';
    }
  });
  
  return isValid;
}

// Date formatter
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Time formatter
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// API helper
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };
  
  try {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    showToast(error.message, 'error');
    throw error;
  }
}

// Load podcasts
async function loadPodcasts() {
  try {
    const data = await apiRequest('/podcasts');
    return data;
  } catch (error) {
    return [];
  }
}

// Load episodes
async function loadEpisodes(podcastId) {
  try {
    const data = await apiRequest(`/episodes?podcastId=${podcastId}`);
    return data;
  } catch (error) {
    return [];
  }
}

// Search podcasts
async function searchPodcasts(query) {
  try {
    const data = await apiRequest(`/podcasts/search?q=${encodeURIComponent(query)}`);
    return data;
  } catch (error) {
    return [];
  }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  const token = localStorage.getItem('token');
  if (token) {
    // User is logged in
    console.log('User is authenticated');
  }
  
  // Add search functionality
  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) {
          searchPodcasts(query);
        }
      }
    });
  }
  
  // Mobile sidebar toggle
  const menuToggle = document.querySelector('.fa-bars');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      document.querySelector('.sidebar')?.classList.toggle('open');
    });
  }
});

// Export functions
window.showToast = showToast;
window.validateForm = validateForm;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.apiRequest = apiRequest;
window.loadPodcasts = loadPodcasts;
window.loadEpisodes = loadEpisodes;
window.searchPodcasts = searchPodcasts;
