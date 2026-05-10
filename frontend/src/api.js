import axios from 'axios';

export const getApiUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined' && import.meta.env.PROD) {
    return '/api';
  }

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
