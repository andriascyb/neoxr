const express = require('express');
const {
  renderRegisterPage,
  renderLoginPage,
  renderDashboardPage
} = require('../member');

const router = express.Router();

router.get('/', (req, res) => {
  res.redirect('/member/dashboard');
});

router.get('/register', (req, res) => {
  res.send(renderRegisterPage());
});

router.get('/login', (req, res) => {
  res.send(renderLoginPage());
});

router.get('/dashboard', (req, res) => {
  res.send(renderDashboardPage('dashboard'));
});

router.get('/deposit', (req, res) => {
  res.send(renderDashboardPage('deposit'));
});

router.get('/wallet', (req, res) => {
  res.redirect('/member/deposit');
});

router.get('/package', (req, res) => {
  res.redirect('/member/deposit');
});

router.get('/apikey', (req, res) => {
  res.send(renderDashboardPage('apikey'));
});

router.get('/security', (req, res) => {
  res.send(renderDashboardPage('security'));
});

module.exports = router;
