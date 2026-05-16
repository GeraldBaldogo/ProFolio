const portfolioService = require('../services/portfolio.service');

const create = async (req, res, next) => {
  try {
    const portfolio = await portfolioService.createPortfolio(req.user.id);
    res.status(201).json({ success: true, data: portfolio });
  } catch (err) {
    next(err);
  }
};

const getMyPortfolios = async (req, res, next) => {
  try {
    const portfolios = await portfolioService.getMyPortfolios(req.user.id);
    res.json({ success: true, data: portfolios });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const portfolio = await portfolioService.getPortfolioById(req.params.id);
    res.json({ success: true, data: portfolio });
  } catch (err) {
    next(err);
  }
};

const submit = async (req, res, next) => {
  try {
    const portfolio = await portfolioService.submitPortfolio(req.params.id);
    res.json({ success: true, data: portfolio });
  } catch (err) {
    next(err);
  }
};

module.exports = { create, getMyPortfolios, getById, submit };