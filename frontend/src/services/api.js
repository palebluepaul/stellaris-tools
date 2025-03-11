/**
 * API service for fetching data from the backend
 */

// Base URL for API requests - adjust this to match your backend URL
const API_BASE_URL = 'http://localhost:3000/api';

// Timeout for fetch requests in milliseconds
const FETCH_TIMEOUT = 5000;

/**
 * Fetch with timeout to prevent hanging requests
 * @param {string} url URL to fetch
 * @param {Object} options Fetch options
 * @returns {Promise} Fetch promise with timeout
 */
const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeout = setTimeout(() => {
    controller.abort();
  }, FETCH_TIMEOUT);
  
  try {
    const response = await fetch(url, { ...options, signal });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
};

/**
 * Check if the backend is available
 * @returns {Promise<boolean>} True if backend is available, false otherwise
 */
export const checkBackendAvailability = async () => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/health`, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    return response.ok;
  } catch (error) {
    console.log('Backend health check failed:', error.message);
    return false;
  }
};

/**
 * Fetch all technologies from the backend
 * @returns {Promise<Array>} Array of technology objects with metadata
 */
export const fetchTechnologies = async () => {
  try {
    // First check if the backend is available
    const isAvailable = await checkBackendAvailability();
    if (!isAvailable) {
      throw new Error('Backend service is not available. Please ensure the server is running.');
    }
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/technologies`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Also fetch technology stats if available
    try {
      const statsResponse = await fetchWithTimeout(`${API_BASE_URL}/tech-stats`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        // Add stats as properties to the data array
        Object.assign(data, {
          baseGameCount: stats.baseGameCount || 0,
          modCount: stats.modCount || 0,
          newModCount: stats.newModCount || 0,
          localizedCount: stats.localizedCount || 0
        });
      }
    } catch (statsError) {
      console.warn('Could not fetch technology stats:', statsError.message);
    }
    
    return data;
  } catch (error) {
    // Handle different types of errors
    if (error.name === 'AbortError') {
      console.error('Request timeout: The server took too long to respond');
      throw new Error('Request timeout: The server took too long to respond');
    } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.error('Connection error: Unable to connect to the backend server');
      throw new Error('Connection error: Unable to connect to the backend server');
    } else {
      console.error('Error fetching technologies:', error.message);
      throw error;
    }
  }
};

/**
 * Fetch a single technology by ID
 * @param {string} id Technology ID
 * @returns {Promise<Object>} Technology object
 */
export const fetchTechnologyById = async (id) => {
  try {
    // First check if the backend is available
    const isAvailable = await checkBackendAvailability();
    if (!isAvailable) {
      throw new Error('Backend service is not available. Please ensure the server is running.');
    }
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/technologies/${id}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // Handle different types of errors
    if (error.name === 'AbortError') {
      console.error(`Request timeout: The server took too long to respond when fetching technology ${id}`);
      throw new Error('Request timeout: The server took too long to respond');
    } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.error('Connection error: Unable to connect to the backend server');
      throw new Error('Connection error: Unable to connect to the backend server');
    } else {
      console.error(`Error fetching technology ${id}:`, error.message);
      throw error;
    }
  }
};

/**
 * Fetch technologies with filtering
 * @param {Object} filters Filter criteria
 * @returns {Promise<Array>} Filtered array of technology objects
 */
export const fetchTechnologiesWithFilters = async (filters) => {
  try {
    // First check if the backend is available
    const isAvailable = await checkBackendAvailability();
    if (!isAvailable) {
      throw new Error('Backend service is not available. Please ensure the server is running.');
    }
    
    // Convert filters object to query string
    const queryParams = new URLSearchParams();
    
    if (filters.categories) {
      Object.entries(filters.categories)
        .filter(([_, value]) => value)
        .forEach(([key, _]) => queryParams.append('category', key));
    }
    
    if (filters.areas) {
      Object.entries(filters.areas)
        .filter(([_, value]) => value)
        .forEach(([key, _]) => queryParams.append('area', key));
    }
    
    if (filters.tiers) {
      Object.entries(filters.tiers)
        .filter(([_, value]) => value)
        .forEach(([key, _]) => queryParams.append('tier', key));
    }
    
    const url = `${API_BASE_URL}/technologies?${queryParams.toString()}`;
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // Handle different types of errors
    if (error.name === 'AbortError') {
      console.error('Request timeout: The server took too long to respond');
      throw new Error('Request timeout: The server took too long to respond');
    } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.error('Connection error: Unable to connect to the backend server');
      throw new Error('Connection error: Unable to connect to the backend server');
    } else {
      console.error('Error fetching filtered technologies:', error.message);
      throw error;
    }
  }
};

/**
 * Fetch all playsets
 * @returns {Promise<Array>} Array of playset objects
 */
export const fetchPlaysets = async () => {
  try {
    // First check if the backend is available
    const isAvailable = await checkBackendAvailability();
    if (!isAvailable) {
      throw new Error('Backend service is not available. Please ensure the server is running.');
    }
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/playsets`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // Handle different types of errors
    if (error.name === 'AbortError') {
      console.error('Request timeout: The server took too long to respond');
      throw new Error('Request timeout: The server took too long to respond');
    } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.error('Connection error: Unable to connect to the backend server');
      throw new Error('Connection error: Unable to connect to the backend server');
    } else {
      console.error('Error fetching playsets:', error.message);
      throw error;
    }
  }
};

/**
 * Fetch the active playset
 * @returns {Promise<Object>} Active playset object
 */
export const fetchActivePlayset = async () => {
  try {
    // First check if the backend is available
    const isAvailable = await checkBackendAvailability();
    if (!isAvailable) {
      throw new Error('Backend service is not available. Please ensure the server is running.');
    }
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/playsets/active`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // No active playset found
      }
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // Handle different types of errors
    if (error.name === 'AbortError') {
      console.error('Request timeout: The server took too long to respond');
      throw new Error('Request timeout: The server took too long to respond');
    } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.error('Connection error: Unable to connect to the backend server');
      throw new Error('Connection error: Unable to connect to the backend server');
    } else {
      console.error('Error fetching active playset:', error.message);
      throw error;
    }
  }
};

/**
 * Activate a playset and reload technologies
 * @param {string} playsetId Playset ID to activate
 * @returns {Promise<Object>} Result of the activation
 */
export const activatePlayset = async (playsetId) => {
  try {
    // First check if the backend is available
    const isAvailable = await checkBackendAvailability();
    if (!isAvailable) {
      throw new Error('Backend service is not available. Please ensure the server is running.');
    }
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/playsets/${playsetId}/activate`, {
      method: 'POST',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Log the response for debugging
    console.log('Playset activation response:', data);
    
    return data;
  } catch (error) {
    // Handle different types of errors
    if (error.name === 'AbortError') {
      console.error('Request timeout: The server took too long to respond');
      throw new Error('Request timeout: The server took too long to respond');
    } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.error('Connection error: Unable to connect to the backend server');
      throw new Error('Connection error: Unable to connect to the backend server');
    } else {
      console.error('Error activating playset:', error.message);
      throw error;
    }
  }
};

/**
 * Fetch all prerequisites for a technology (recursively)
 * @param {string} techId Technology ID
 * @returns {Promise<Array>} Array of prerequisite technology objects
 */
export const fetchTechnologyPrerequisites = async (techId) => {
  try {
    // First check if the backend is available
    const isAvailable = await checkBackendAvailability();
    if (!isAvailable) {
      throw new Error('Backend service is not available. Please ensure the server is running.');
    }
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/technologies/${techId}/prerequisites?recursive=true`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // Handle different types of errors
    if (error.name === 'AbortError') {
      console.error(`Request timeout: The server took too long to respond when fetching prerequisites for ${techId}`);
      throw new Error('Request timeout: The server took too long to respond');
    } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.error('Connection error: Unable to connect to the backend server');
      throw new Error('Connection error: Unable to connect to the backend server');
    } else {
      console.error(`Error fetching prerequisites for technology ${techId}:`, error.message);
      throw error;
    }
  }
};

/**
 * Fetch all prerequisites for multiple technologies (recursively)
 * @param {Array<string>} techIds Array of technology IDs
 * @returns {Promise<Array>} Array of prerequisite technology objects
 */
export const fetchMultipleTechnologyPrerequisites = async (techIds) => {
  try {
    // First check if the backend is available
    const isAvailable = await checkBackendAvailability();
    if (!isAvailable) {
      throw new Error('Backend service is not available. Please ensure the server is running.');
    }
    
    // Convert tech IDs array to query string
    const queryParams = new URLSearchParams();
    techIds.forEach(id => queryParams.append('ids', id));
    queryParams.append('recursive', 'true');
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/technologies/prerequisites?${queryParams.toString()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // Handle different types of errors
    if (error.name === 'AbortError') {
      console.error(`Request timeout: The server took too long to respond when fetching prerequisites for multiple technologies`);
      throw new Error('Request timeout: The server took too long to respond');
    } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.error('Connection error: Unable to connect to the backend server');
      throw new Error('Connection error: Unable to connect to the backend server');
    } else {
      console.error(`Error fetching prerequisites for multiple technologies:`, error.message);
      throw error;
    }
  }
};

/**
 * Fetch all recursive prerequisites for a technology using the new API endpoint
 * @param {string} techId Technology ID
 * @param {boolean} includeOriginal Whether to include the original technology in the result
 * @returns {Promise<Object>} Object containing direct prerequisites, all prerequisites, and a dependency tree
 */
export const fetchAllPrerequisites = async (techId, includeOriginal = false) => {
  try {
    // First check if the backend is available
    const isAvailable = await checkBackendAvailability();
    if (!isAvailable) {
      throw new Error('Backend service is not available. Please ensure the server is running.');
    }
    
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/technologies/${techId}/prerequisites/all?includeOriginal=${includeOriginal}`, 
      {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      }
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // Handle different types of errors
    if (error.name === 'AbortError') {
      console.error(`Request timeout: The server took too long to respond when fetching all prerequisites for ${techId}`);
      throw new Error('Request timeout: The server took too long to respond');
    } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.error('Connection error: Unable to connect to the backend server');
      throw new Error('Connection error: Unable to connect to the backend server');
    } else {
      console.error(`Error fetching all prerequisites for technology ${techId}:`, error.message);
      throw error;
    }
  }
};

/**
 * Fetch all recursive prerequisites for multiple technologies
 * @param {Array<string>} techIds Array of technology IDs
 * @param {boolean} includeOriginal Whether to include the original technologies in the result
 * @returns {Promise<Object>} Object containing all prerequisites and dependency trees for each technology
 */
export const fetchAllPrerequisitesForMultipleTechnologies = async (techIds, includeOriginal = false) => {
  try {
    // First check if the backend is available
    const isAvailable = await checkBackendAvailability();
    if (!isAvailable) {
      throw new Error('Backend service is not available. Please ensure the server is running.');
    }
    
    // Ensure techIds is an array
    const ids = Array.isArray(techIds) ? techIds : [techIds];
    
    if (ids.length === 0) {
      return { technologies: {} };
    }
    
    // Build the URL with query parameters
    const url = new URL(`${API_BASE_URL}/technologies/prerequisites/all`);
    
    // Add each ID as a separate query parameter
    ids.forEach(id => {
      url.searchParams.append('ids', id);
    });
    
    // Add other parameters
    url.searchParams.append('includeOriginal', includeOriginal.toString());
    
    const response = await fetchWithTimeout(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // Handle different types of errors
    if (error.name === 'AbortError') {
      console.error(`Request timeout: The server took too long to respond when fetching all prerequisites for multiple technologies`);
      throw new Error('Request timeout: The server took too long to respond');
    } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.error('Connection error: Unable to connect to the backend server');
      throw new Error('Connection error: Unable to connect to the backend server');
    } else {
      console.error(`Error fetching all prerequisites for multiple technologies:`, error.message);
      throw error;
    }
  }
}; 