import axios from 'axios';

const BASE_URL = 'http://localhost:4000/api';

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
