import { User, Exam, Result, UserRole } from '../types';

const KEYS = {
  USERS: 'smartexam_users',
  EXAMS: 'smartexam_exams',
  RESULTS: 'smartexam_results',
  CURRENT_USER: 'smartexam_current_user'
};

// --- User Management ---
export const registerUser = (name: string, email: string, role: UserRole): User => {
  const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  const newUser: User = {
    id: crypto.randomUUID(),
    name,
    email,
    role
  };
  users.push(newUser);
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(newUser));
  return newUser;
};

export const loginUser = (email: string): User | null => {
  const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  const user = users.find(u => u.email === email);
  if (user) {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  }
  return null;
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(KEYS.CURRENT_USER);
  return stored ? JSON.parse(stored) : null;
};

export const logoutUser = () => {
  localStorage.removeItem(KEYS.CURRENT_USER);
};

// --- Exam Management ---
export const saveExam = (exam: Exam) => {
  const exams: Exam[] = JSON.parse(localStorage.getItem(KEYS.EXAMS) || '[]');
  exams.push(exam);
  localStorage.setItem(KEYS.EXAMS, JSON.stringify(exams));
};

export const getExamsByTeacher = (teacherId: string): Exam[] => {
  const exams: Exam[] = JSON.parse(localStorage.getItem(KEYS.EXAMS) || '[]');
  return exams.filter(e => e.teacherId === teacherId).sort((a, b) => b.createdAt - a.createdAt);
};

export const getExamByRoomCode = (code: string): Exam | undefined => {
  const exams: Exam[] = JSON.parse(localStorage.getItem(KEYS.EXAMS) || '[]');
  return exams.find(e => e.roomCode === code);
};

export const updateExamStatus = (examId: string, status: 'OPEN' | 'CLOSED') => {
  const exams: Exam[] = JSON.parse(localStorage.getItem(KEYS.EXAMS) || '[]');
  const idx = exams.findIndex(e => e.id === examId);
  if (idx !== -1) {
    exams[idx].status = status;
    localStorage.setItem(KEYS.EXAMS, JSON.stringify(exams));
  }
};

// --- Result Management ---
export const saveResult = (result: Result) => {
  const results: Result[] = JSON.parse(localStorage.getItem(KEYS.RESULTS) || '[]');
  // Check if already submitted
  const existing = results.find(r => r.examId === result.examId && r.studentId === result.studentId);
  if (existing) return; // Prevent double submission logic handled in UI mostly
  results.push(result);
  localStorage.setItem(KEYS.RESULTS, JSON.stringify(results));
};

export const getResultsByExam = (examId: string): Result[] => {
  const results: Result[] = JSON.parse(localStorage.getItem(KEYS.RESULTS) || '[]');
  return results.filter(r => r.examId === examId).sort((a, b) => b.score - a.score);
};

export const getStudentResults = (studentId: string): { result: Result, examTitle: string }[] => {
  const results: Result[] = JSON.parse(localStorage.getItem(KEYS.RESULTS) || '[]');
  const exams: Exam[] = JSON.parse(localStorage.getItem(KEYS.EXAMS) || '[]');
  
  return results
    .filter(r => r.studentId === studentId)
    .map(r => {
      const exam = exams.find(e => e.id === r.examId);
      return {
        result: r,
        examTitle: exam ? exam.title : 'Unknown Exam'
      };
    });
};