/* ===========================
   NexBoard — config.js
   Global configuration — load this first on every page
   =========================== */

const API = 'http://127.0.0.1:8000/api';

const ENDPOINTS = {
  boards:       ()      => '/boards/',
  board:        id      => `/boards/${id}/`,
  tasks:        ()      => '/tasks/',
  task:         id      => `/tasks/${id}/`,
  assignedToMe: ()      => '/tasks/assigned-to-me/',
  reviewing:    ()      => '/tasks/reviewing/',
  emailCheck:   email   => `/email-check/?email=${encodeURIComponent(email)}`,
};
