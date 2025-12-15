import React, { useState } from 'react';
import { Exam, Result } from '../types';
import { CheckCircle, Timer } from 'lucide-react';

interface ExamTakerProps {
  exam: Exam;
  studentId: string;
  studentName: string;
  onSubmit: (result: Result) => void;
  onCancel: () => void;
}

const ExamTaker: React.FC<ExamTakerProps> = ({ exam, studentId, studentName, onSubmit, onCancel }) => {
  const [answers, setAnswers] = useState<number[]>(new Array(exam.questions.length).fill(-1));
  const [currentQ, setCurrentQ] = useState(0);

  const handleSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleFinish = () => {
    // Calculate Score
    let score = 0;
    answers.forEach((ans, idx) => {
      if (ans === exam.questions[idx].correctAnswerIndex) {
        score++;
      }
    });

    const result: Result = {
      id: crypto.randomUUID(),
      examId: exam.id,
      studentId: studentId,
      studentName: studentName,
      score: score,
      totalQuestions: exam.questions.length,
      answers: answers,
      submittedAt: Date.now()
    };

    onSubmit(result);
  };

  const answeredCount = answers.filter(a => a !== -1).length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{exam.title}</h2>
            <p className="opacity-80 text-sm">Question {currentQ + 1} of {exam.questions.length}</p>
          </div>
          <div className="flex items-center space-x-2 bg-indigo-700 px-3 py-1 rounded-full">
            <Timer className="w-4 h-4" />
            <span className="text-sm font-medium">In Progress</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-2">
          <div 
            className="bg-green-500 h-2 transition-all duration-300" 
            style={{ width: `${((currentQ + 1) / exam.questions.length) * 100}%` }}
          ></div>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-xl text-gray-800 font-medium mb-6">
            {exam.questions[currentQ].text}
          </p>

          <div className="space-y-3">
            {exam.questions[currentQ].options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between group ${
                  answers[currentQ] === idx
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">{opt}</span>
                {answers[currentQ] === idx && (
                  <CheckCircle className="w-5 h-5 text-indigo-600" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
              disabled={currentQ === 0}
              className={`px-6 py-2 rounded-lg font-medium ${
                currentQ === 0 ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Previous
            </button>
            
            {currentQ < exam.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQ(prev => prev + 1)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={answeredCount < exam.questions.length}
                className={`px-6 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  answeredCount < exam.questions.length 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                Submit Exam
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <button onClick={onCancel} className="text-gray-500 hover:text-red-500 text-sm">Cancel Exam</button>
      </div>
    </div>
  );
};

export default ExamTaker;