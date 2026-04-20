const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

// @route   GET /api/projects
// @desc    Get all projects
router.get('/', async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   GET /api/projects/search
// @desc    Search projects
router.get('/search', async (req, res) => {
    const { q } = req.query;
    try {
        const searchRegex = new RegExp(q, 'i');
        const projects = await Project.find({
            $or: [
                { project_title: searchRegex },
                { student_name: searchRegex },
                { roll_number: searchRegex }
            ]
        }).sort({ createdAt: -1 });
        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
