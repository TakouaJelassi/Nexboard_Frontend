/* ===========================
   NexBoard — config.js
   Global configuration — load this first on every page
   =========================== */

const API = 'https://nexboard-backend-ld7s.onrender.com/api';

const ENDPOINTS = {
  boards:       ()      => '/boards/',
  board:        id      => `/boards/${id}/`,
  tasks:        ()      => '/tasks/',
  task:         id      => `/tasks/${id}/`,
  assignedToMe: ()      => '/tasks/assigned-to-me/',
  reviewing:    ()      => '/tasks/reviewing/',
  emailCheck:   email   => `/email-check/?email=${encodeURIComponent(email)}`,
  comments:     taskId  => `/tasks/${taskId}/comments/`,
  comment:      (taskId, commentId) => `/tasks/${taskId}/comments/${commentId}/`,
};
