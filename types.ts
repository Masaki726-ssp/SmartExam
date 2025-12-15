export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Exam {
  id: string;
  teacherId: string;
  title: string;
  roomCode: string;
  questions: Question[];
  createdAt: number;
  status: 'OPEN' | 'CLOSED';
}

export interface Result {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  answers: number[]; // Index of selected answers
  submittedAt: number;
}

export interface ExamStats {
  mean: number;
  median: number;
  mode: number;
  min: number;
  max: number;
  stdDev: number;
  count: number;
  tValue: number; // One-sample t-test against 50% score
  pValue: number; // Approximate
}