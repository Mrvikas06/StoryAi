const router = require('express').Router();
const mongoose = require('mongoose');
const Story = require('../models/Story');

router.get('/:childId', async (req, res) => {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const stories = await Story
        .find({ childId: req.params.childId })
        .sort({ createdAt: -1 })
        .limit(20);
      return res.json(stories);
    }
    return res.json([]);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      await Story.findByIdAndDelete(req.params.id);
    }
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
