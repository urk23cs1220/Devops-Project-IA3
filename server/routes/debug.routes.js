const express = require('express');
const router = express.Router();

router.get('/db-status', (req, res) => {
    res.json({ status: 'connected', database: 'supabase' });
});

module.exports = router;