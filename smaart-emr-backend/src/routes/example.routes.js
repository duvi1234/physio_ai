const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');

// Public example route - returns sample patients (no auth)
router.get('/patients', asyncHandler(async (req, res) => {
  const sample = [
    { id: 'p1', name: 'John Doe', age: 34 },
    { id: 'p2', name: 'Jane Smith', age: 28 }
  ];
  return res.status(200).json({ success: true, message: 'Sample patients', data: sample });
}));

module.exports = router;
