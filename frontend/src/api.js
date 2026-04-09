import axios from 'axios';

// Auto-detect API URL based on environment
const getApiUrl = () => {
  if (import.meta.env.PROD) {
    // On production, use the same host (Vercel/Netlify will handle routing)
    return `${window.location.origin}/api`;
  }
  // Local development
  return 'http://localhost:4000/api';
};

const BASE_URL = getApiUrl();

export const generateStory = (words, childId = 'guest') =>
  axios.post(`${BASE_URL}/story/generate`, { words, childId })
       .then(r => r.data.story);

export const getSavedStories = (childId = 'guest') =>
  axios.get(`${BASE_URL}/stories/${childId}`).then(r => r.data);

export const deleteStory = (id) =>
  axios.delete(`${BASE_URL}/stories/${id}`).then(r => r.data);

export const speakText = (text, lang = 'en') =>
  axios.post(`${BASE_URL}/tts/speak`, { text, lang }, { responseType: 'blob' })
       .then(r => r.data);
