// controllers/cars.js
const express = require('express');
const router = express.Router();
const Car = require('../models/carModel');

router.get('/api/cars', async (req, res) => {
    console.log('API route accessed');
    try {
        const cars = await Car.find();
        res.json(cars);
    } catch (error) {
        console.error('Error fetching cars:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
