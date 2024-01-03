const express = require('express');
const router = express.Router();
const path = require('path');


// Route to serve uploaded pictures
router.get('/picture/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, './uploads/picture', filename); // Update the path to match your file structure

  // Send the file as a response
  res.sendFile(filePath);
});

// Route to serve recorded audio
router.get('/audio/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, './uploads/audio', filename); // Update the path to match your file structure

  // Send the file as a response
  res.sendFile(filePath);
});





module.exports = router;
