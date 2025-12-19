export const API_CONFIG = {
  // BASE_URL: 'http://localhost:8000',
  BASE_URL: 'https://concentrations-treatment-respondents-italia.trycloudflare.com',
}

export const getApiUrl = (endpoint: string) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`
}

// Handle full URLs, Base64 data URLs, and relative paths
export const getImageUrl = (imagePath: string) => {
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath
  }
  
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
  return `${API_CONFIG.BASE_URL}/${cleanPath}`
}
