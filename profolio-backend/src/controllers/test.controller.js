const testService = require('../services/test.service');

const createTest = async (req, res, next) => {
  try {
    const test = await testService.createTest(req.user.id, req.body);
    res.status(201).json({ success: true, data: test });
  } catch (err) { next(err); }
};

const updateTest = async (req, res, next) => {
  try {
    const test = await testService.updateTest(req.params.id, req.user.id, req.body);
    res.json({ success: true, data: test });
  } catch (err) { next(err); }
};

const deleteTest = async (req, res, next) => {
  try {
    await testService.deleteTest(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const test = await testService.getById(req.params.id, req.user);
    res.json({ success: true, data: test });
  } catch (err) { next(err); }
};

const listMyTests = async (req, res, next) => {
  try {
    const tests = await testService.listMyTests(req.user.id);
    res.json({ success: true, data: tests });
  } catch (err) { next(err); }
};

const assignTest = async (req, res, next) => {
  try {
    const result = await testService.assignTest(
      req.params.id,
      req.user.id,
      req.body.studentUserIds,
      req.body.due_date
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

const getAssignmentsForTest = async (req, res, next) => {
  try {
    const assignments = await testService.getAssignmentsForTest(req.params.id, req.user.id);
    res.json({ success: true, data: assignments });
  } catch (err) { next(err); }
};

const getMyAssignedTests = async (req, res, next) => {
  try {
    const assignments = await testService.getMyAssignedTests(req.user.id);
    res.json({ success: true, data: assignments });
  } catch (err) { next(err); }
};

const startAssignment = async (req, res, next) => {
  try {
    const test = await testService.startAssignment(req.params.id, req.user.id);
    res.json({ success: true, data: test });
  } catch (err) { next(err); }
};

const listStudents = async (req, res, next) => {
  try {
    const students = await testService.listStudents();
    res.json({ success: true, data: students });
  } catch (err) {
    next(err);
  }
};

const getMyStudents = async (req, res, next) => {
  try {
    const students = await testService.getMyStudents(req.user.id);
    res.json({ success: true, data: students });
  } catch (err) { next(err); }
};

module.exports = {
  createTest,
  updateTest,
  deleteTest,
  getById,
  listMyTests,
  assignTest,
  getAssignmentsForTest,
  getMyAssignedTests,
  listStudents,
  getMyStudents, 
  startAssignment,
};