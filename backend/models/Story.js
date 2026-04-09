const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
  childId:          { type: String, default: 'guest' },
  words:            [String],
  title:            String,
  emoji:            String,
  english:          String,
  hindi:            String,
  question:         { en: String, hi: String },
  fromImage:        { type: Boolean, default: false },
  imageDescription: String,
  createdAt:        { type: Date, default: Date.now }
});

// In-memory fallback if MongoDB is not connected
let storyCache = [];
let storyIdCounter = 1;

const StoryModel = mongoose.model('Story', StorySchema);

// Override create method to handle both DB and in-memory
const originalCreate = StoryModel.create.bind(StoryModel);
StoryModel.create = async function(data) {
  try {
    return await originalCreate(data);
  } catch (err) {
    if (err.name === 'MongooseError' || err.message.includes('connect')) {
      // Fallback to in-memory storage
      const story = {
        _id: `temp_${storyIdCounter++}`,
        ...data,
        createdAt: new Date()
      };
      storyCache.push(story);
      console.log('💾 Story saved to memory cache (MongoDB unavailable)');
      return story;
    }
    throw err;
  }
};

module.exports = StoryModel;