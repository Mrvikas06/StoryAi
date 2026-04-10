import axios from 'axios';

// Auto-detect API URL based on environment
const getApiUrl = () => {
  // Production deployment on Render.io
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    const host = window.location.hostname;
    
    // If running on same host (e.g., localhost:4000), use relative path
    if (host === 'localhost' || host === '127.0.0.1') {
      return '/api';
    }
    
    // If on render.com, construct backend URL
    if (host.includes('pages.dev')) {
      // Cloudflare Pages - use the API backend URL
      return 'https://storyai-1-o3pn.onrender.com/api';
    }
    
    // Default: use relative path (works when backend serves frontend)
    return '/api';
  }
  
  // Development: use local backend
  return 'http://localhost:4000/api';
};

const BASE_URL = getApiUrl();

console.log('📡 API Base URL:', BASE_URL);

export const generateStory = (words, childId = 'guest') =>
  axios.post(`${BASE_URL}/story/generate`, { words, childId })
       .then(r => r.data.story)
       .catch(err => {
         console.error('Error generating story:', err);
         throw err;
       });

export const getSavedStories = (childId = 'guest') =>
  axios.get(`${BASE_URL}/stories/${childId}`)
       .then(r => r.data)
       .catch(err => {
         console.error('Error fetching stories:', err);
         throw err;
       });

export const deleteStory = (id) =>
  axios.delete(`${BASE_URL}/stories/${id}`)
       .then(r => r.data)
       .catch(err => {
         console.error('Error deleting story:', err);
         throw err;
       });

export const speakText = (text, lang = 'en') =>
  axios.post(`${BASE_URL}/tts/speak`, { text, lang }, { responseType: 'blob' })
       .then(r => r.data)
       .catch(err => {
         console.error('Error generating speech:', err);
         throw err;
       });
