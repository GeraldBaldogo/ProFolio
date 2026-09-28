const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { assertOwnsPortfolio, assertCanReadPortfolio, assertOwnsRow, pickFields } = require('../utils/ownership');

const skillRepo = require('../repositories/skill.repo');
const certRepo = require('../repositories/certification.repo');
const expRepo = require('../repositories/experience.repo');
const achRepo = require('../repositories/achievement.repo');

// The columns a student can set on each kind of item — the same fields the
// Portfolio Builder form shows. Everything else in the body is ignored.
const FIELDS = {
  skills: ['skill_name', 'category', 'self_rating'],
  certifications: ['title', 'issuer', 'credential_url', 'issued_date', 'expiry_date'],
  experiences: ['company', 'role', 'description', 'start_date', 'end_date', 'is_current'],
  achievements: ['title', 'description', 'category', 'achieved_date'],
};

// Every write checks that the logged-in student owns the portfolio first.
// Before, any logged-in student could add to, edit or delete another
// student's items just by knowing the portfolio or item id.
const handler = (repo, table) => ({
  add: async (req, res, next) => {
    try {
      await assertOwnsPortfolio(req.params.portfolio_id, req.user);
      const data = await repo.create({
        ...pickFields(req.body, FIELDS[table]),
        portfolio_id: req.params.portfolio_id,
      });
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  },
  getAll: async (req, res, next) => {
    try {
      await assertCanReadPortfolio(req.params.portfolio_id, req.user);
      const data = await repo.findByPortfolioId(req.params.portfolio_id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },
  update: async (req, res, next) => {
    try {
      await assertOwnsRow(table, req.params.id, req.user);
      const data = await repo.update(req.params.id, pickFields(req.body, FIELDS[table]));
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },
  remove: async (req, res, next) => {
    try {
      await assertOwnsRow(table, req.params.id, req.user);
      await repo.remove(req.params.id);
      res.json({ success: true, data: { message: 'Deleted successfully.' } });
    } catch (err) { next(err); }
  },
});

const skills = handler(skillRepo, 'skills');
const certs = handler(certRepo, 'certifications');
const exps = handler(expRepo, 'experiences');
const achs = handler(achRepo, 'achievements');

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