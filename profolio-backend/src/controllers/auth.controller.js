const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const google = async (req, res, next) => {
  try {
    const { code, role, intent } = req.body || {};
    const result = await authService.googleSignIn({ code, role, intent });
    res.status(result.created ? 201 : 200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const facebook = async (req, res, next) => {
  try {
    const { accessToken, role, intent } = req.body || {};
    const result = await authService.facebookSignIn({ accessToken, role, intent });
    res.status(result.created ? 201 : 200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const github = async (req, res, next) => {
  try {
    const { code, redirectUri, role, intent } = req.body || {};
    const result = await authService.githubSignIn({ code, redirectUri, role, intent });
    res.status(result.created ? 201 : 200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, google, facebook, github };