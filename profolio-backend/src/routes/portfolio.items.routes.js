const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const supabase = require('../config/db');

const skillRepo = require('../repositories/skill.repo');
const certRepo = require('../repositories/certification.repo');
const expRepo = require('../repositories/experience.repo');
const achRepo = require('../repositories/achievement.repo');

// Helper
const handler = (repo) => ({
  add: async (req, res, next) => {
    try {
      const data = await repo.create({ portfolio_id: req.params.portfolio_id, ...req.body });
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  },
  getAll: async (req, res, next) => {
    try {
      const data = await repo.findByPortfolioId(req.params.portfolio_id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },
  update: async (req, res, next) => {
    try {
      const data = await repo.update(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },
  remove: async (req, res, next) => {
    try {
      await repo.remove(req.params.id);
      res.json({ success: true, data: { message: 'Deleted successfully.' } });
    } catch (err) { next(err); }
  }
});

const skills = handler(skillRepo);
const certs = handler(certRepo);
const exps = handler(expRepo);
const achs = handler(achRepo);

// Skills
router.post('/skills/:portfolio_id', authenticate, requireRole('student'), skills.add);
router.get('/skills/:portfolio_id', authenticate, skills.getAll);
router.patch('/skills/:id', authenticate, requireRole('student'), skills.update);
router.delete('/skills/:id', authenticate, requireRole('student'), skills.remove);

// Certifications
router.post('/certifications/:portfolio_id', authenticate, requireRole('student'), certs.add);
router.get('/certifications/:portfolio_id', authenticate, certs.getAll);
router.patch('/certifications/:id', authenticate, requireRole('student'), certs.update);
router.delete('/certifications/:id', authenticate, requireRole('student'), certs.remove);

// Experiences
router.post('/experiences/:portfolio_id', authenticate, requireRole('student'), exps.add);
router.get('/experiences/:portfolio_id', authenticate, exps.getAll);
router.patch('/experiences/:id', authenticate, requireRole('student'), exps.update);
router.delete('/experiences/:id', authenticate, requireRole('student'), exps.remove);

// Achievements
router.post('/achievements/:portfolio_id', authenticate, requireRole('student'), achs.add);
router.get('/achievements/:portfolio_id', authenticate, achs.getAll);
router.patch('/achievements/:id', authenticate, requireRole('student'), achs.update);
router.delete('/achievements/:id', authenticate, requireRole('student'), achs.remove);

module.exports = router;