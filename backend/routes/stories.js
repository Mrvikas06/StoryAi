const router = require('express').Router();
const Story  = require('../models/Story');

router.get('/:childId', async (req, res) => {
  try {
    const stories = await Story
      .find({ childId: req.params.childId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(stories);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Story.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;