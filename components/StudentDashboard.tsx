import React, { useState, useEffect } from 'react';
import { User, Exam, Result } from '../types';
import { getExamByRoomCode, getStudentResults, saveResult } from '../services/storageService';
import ExamTaker from './ExamTaker';
import { LogOut, Search, Clock, Award } from 'lucide-react';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onLogout }) => {
  const [roomCode, setRoomCode] = useState('');
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [pastResults, setPastResults] = useState<{ result: Result, examTitle: string }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = () => {
    setPastResults(getStudentResults(user.id));
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Check if already taken
    const alreadyTaken = pastResults.some(r => r.result.examId === activeExam?.id); // Basic check, better done after fetch
    
    const exam = getExamByRoomCode(roomCode.toUpperCase());
    
    if (!exam) {
      setError('Invalid room code.');
      return;
    }

    if (exam.status === 'CLOSED') {
      setError('This exam is closed.');
      return;
    }

    // Double check history
    const history = getStudentResults(user.id);
    if (history.find(h => h.result.examId === exam.id)) {
        setError("You have already submitted this exam.");
        return;
    }

    setActiveExam(exam);
  };

  const handleSubmitExam = (result: Result) => {
    saveResult(result);
    setActiveExam(null);
    setRoomCode('');
    loadResults();
  };

  if (activeExam) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <ExamTaker 
          exam={activeExam}
          studentId={user.id}
          studentName={user.name}
          onSubmit={handleSubmitExam}
          onCancel={() => setActiveExam(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
       <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">Student Portal</h1>
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{user.name}</span>
                <button onClick={onLogout} className="text-gray-500 hover:text-red-600 transition">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Join Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-10 text-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to take a quiz?</h2>
            <p className="mb-6 opacity-90">Enter the room code provided by your teacher.</p>
            <form onSubmit={handleJoin} className="max-w-md mx-auto relative">
                <input 
                    type="text" 
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    className="w-full py-4 pl-6 pr-32 rounded-full text-gray-800 font-mono text-xl tracking-widest outline-none focus:ring-4 focus:ring-purple-300 shadow-lg"
                    maxLength={6}
                />
                <button 
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 bg-indigo-800 hover:bg-indigo-900 text-white px-6 rounded-full font-bold transition flex items-center gap-2"
                >
                    JOIN <Search className="w-4 h-4" />
                </button>
            </form>
            {error && <p className="mt-4 bg-red-500 bg-opacity-20 inline-block px-4 py-1 rounded text-red-100 border border-red-400">{error}</p>}
        </div>

        {/* History Section */}
        <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" /> Past Results
            </h3>
            <div className="space-y-4">
                {pastResults.map((item) => (
                    <div key={item.result.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center transition hover:shadow-md">
                        <div>
                            <h4 className="font-bold text-lg text-gray-800">{item.examTitle}</h4>
                            <p className="text-sm text-gray-500">Submitted: {new Date(item.result.submittedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="text-right">
                                <span className="block text-2xl font-bold text-indigo-600">{((item.result.score / item.result.totalQuestions) * 100).toFixed(0)}%</span>
                                <span className="text-xs text-gray-400">{item.result.score} / {item.result.totalQuestions} Correct</span>
                            </div>
                            <div className={`p-3 rounded-full ${item.result.score / item.result.totalQuestions >= 0.5 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                <Award className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                ))}
                {pastResults.length === 0 && (
                    <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-dashed">
                        No past exams found.
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;