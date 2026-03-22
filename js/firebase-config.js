// Firebase Configuration - DEPRECATED
// This file now redirects to MongoDB configuration for backward compatibility
// ไฟล์นี้เปลี่ยนเป็นใช้ MongoDB แทน Firebase แล้ว

console.warn('[DEPRECATED] firebase-config.js is deprecated. Please use mongodb-config.js instead.');

// Re-export all functions from mongodb-config.js
export {
  saveStudentToFirebase,
  getAllStudents,
  getStudentByName,
  saveTestResult,
  getStudentResults,
  getAllClassrooms,
  saveActivityToFirebase,
  getAllActivities,
  deleteActivityFromFirebase,
  db
} from './mongodb-config.js';
