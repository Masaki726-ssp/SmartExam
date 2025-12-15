import React, { useState, useEffect } from 'react';
import { User, Exam } from '../types';
import { saveExam, getExamsByTeacher, getResultsByExam, updateExamStatus } from '../services/storageService';
import { generateQuizFromText } from '../services/geminiService';
import StatsView from './StatsView';
import { Plus, FileText, BarChart2, Loader2, LogOut, Lock, Unlock } from 'lucide-react';

interface TeacherDashboardProps {
  user: User;
  onLogout: () => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user, onLogout }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  
  // Creation State
  const [newTitle, setNewTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    refreshExams();
  }, []);

  const refreshExams = () => {
    setExams(getExamsByTeacher(user.id));
  };

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "text/plain" || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (ev.target?.result) {
                setTextContent(ev.target.result as string);
            }
        };
        reader.readAsText(file);
    } else {
        alert("For this demo, please upload .txt files or paste content directly. PDF parsing requires backend servers.");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !textContent) {
        setError("Please provide a title and content.");
        return;
    }

    setIsLoading(true);
    setError('');

    try {
        const questions = await generateQuizFromText(textContent);
        if (questions.length === 0) {
            throw new Error("AI returned no questions. Try different content.");
        }

        const newExam: Exam = {
            id: crypto.randomUUID(),
            teacherId: user.id,
            title: newTitle,
            roomCode: generateRoomCode(),
            questions,
            createdAt: Date.now(),
            status: 'OPEN'
        };

        saveExam(newExam);
        refreshExams();
        setIsCreating(false);
        setNewTitle('');
        setTextContent('');
    } catch (err: any) {
        setError(err.message || "Failed to create exam");
    } finally {
        setIsLoading(false);
    }
  };

  const toggleStatus = (exam: Exam) => {
      const newStatus = exam.status === 'OPEN' ? 'CLOSED' : 'OPEN';
      updateExamStatus(exam.id, newStatus);
      refreshExams();
  };

  if (selectedExamId) {
      const exam = exams.find(e => e.id === selectedExamId);
      if (exam) {
          const results = getResultsByExam(exam.id);
          return <StatsView exam={exam} results={results} onBack={() => setSelectedExamId(null)} />;
      }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                    <FileText className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold text-gray-800">Teacher Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Hello, {user.name}</span>
                <button onClick={onLogout} className="text-gray-500 hover:text-red-600 transition">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isCreating ? (
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Exam</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title</label>
                        <input 
                            type="text" 
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="e.g., Biology Final Chapter 1"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Source Material</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition mb-2">
                             <input 
                                type="file" 
                                id="fileUpload" 
                                className="hidden" 
                                onChange={handleFileUpload} 
                                accept=".txt,.json,.md"
                            />
                            <label htmlFor="fileUpload" className="cursor-pointer text-indigo-600 hover:text-indigo-800 font-medium">
                                Upload text file
                            </label>
                            <span className="text-gray-500"> or paste content below</span>
                        </div>
                        <textarea
                            className="w-full border rounded-lg p-3 h-48 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                            placeholder="Paste lecture notes, article, or text content here used to generate questions..."
                        ></textarea>
                         <p className="text-xs text-gray-500 mt-1">AI will generate 5+ multiple choice questions from this text.</p>
                    </div>

                    {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded">{error}</div>}

                    <div className="flex gap-3 justify-end pt-4">
                        <button 
                            type="button" 
                            onClick={() => setIsCreating(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : 'Generate Exam'}
                        </button>
                    </div>
                </form>
            </div>
        ) : (
            <>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Your Exams</h2>
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm"
                    >
                        <Plus className="w-5 h-5" /> Create Exam
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams.map(exam => (
                        <div key={exam.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-gray-900 truncate pr-2">{exam.title}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${exam.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {exam.status}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-500 mb-4">
                                    Created: {new Date(exam.createdAt).toLocaleDateString()}
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center mb-4">
                                    <span className="text-xs text-gray-500 uppercase font-semibold">Room Code</span>
                                    <span className="font-mono text-lg font-bold text-indigo-600 tracking-wider">{exam.roomCode}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setSelectedExamId(exam.id)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 py-2 rounded-lg hover:bg-indigo-100 transition font-medium text-sm"
                                    >
                                        <BarChart2 className="w-4 h-4" /> Results
                                    </button>
                                     <button 
                                        onClick={() => toggleStatus(exam)}
                                        className="w-10 flex items-center justify-center bg-gray-50 text-gray-600 py-2 rounded-lg hover:bg-gray-200 transition"
                                        title={exam.status === 'OPEN' ? 'Close Exam' : 'Open Exam'}
                                    >
                                        {exam.status === 'OPEN' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {exams.length === 0 && (
                         <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500">No exams created yet. Start by creating one!</p>
                        </div>
                    )}
                </div>
            </>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;