import React, { useMemo } from 'react';
import { Result, Exam, ExamStats } from '../types';
import { calculateStats } from '../services/statsService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, TrendingUp, Users, AlertCircle } from 'lucide-react';

interface StatsViewProps {
  exam: Exam;
  results: Result[];
  onBack: () => void;
}

const StatsView: React.FC<StatsViewProps> = ({ exam, results, onBack }) => {
  const stats: ExamStats = useMemo(() => calculateStats(results, exam.questions.length), [results, exam]);

  const distributionData = useMemo(() => {
    // Bucket scores into bins
    const bins = new Array(6).fill(0); // 0-20, 20-40, ..., 80-100
    results.forEach(r => {
      const pct = (r.score / exam.questions.length) * 100;
      const index = Math.min(Math.floor(pct / 20), 4);
      bins[index]++;
    });
    return [
      { name: '0-20%', count: bins[0] },
      { name: '21-40%', count: bins[1] },
      { name: '41-60%', count: bins[2] },
      { name: '61-80%', count: bins[3] },
      { name: '81-100%', count: bins[4] },
    ];
  }, [results, exam]);

  const downloadCSV = () => {
    const headers = ["Student Name", "Score", "Total", "Percentage", "Submitted At"];
    const rows = results.map(r => [
      r.studentName,
      r.score,
      exam.questions.length,
      `${((r.score / exam.questions.length) * 100).toFixed(2)}%`,
      new Date(r.submittedAt).toLocaleString()
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${exam.title}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (results.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-700">No submissions yet</h3>
        <p className="text-gray-500 mb-6">Waiting for students to take the exam.</p>
        <button onClick={onBack} className="text-indigo-600 font-medium hover:underline">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">{exam.title} Statistics</h2>
            <p className="text-gray-500">Room Code: {exam.roomCode}</p>
        </div>
        <div className="flex gap-3">
             <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                Back
            </button>
            <button 
                onClick={downloadCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm"
            >
                <Download className="w-4 h-4" /> Export CSV
            </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Average Score</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.mean.toFixed(1)}<span className="text-sm text-gray-400 font-normal"> / 100</span></h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-sm text-gray-500">SD: {stats.stdDev.toFixed(2)}</div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
           <div className="flex justify-between items-start mb-2">
             <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Participants</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.count}</h3>
             </div>
             <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
           </div>
           <div className="text-sm text-gray-500">Students</div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
             <div className="flex justify-between items-start mb-2">
             <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Highest Score</p>
              <h3 className="text-2xl font-bold text-green-600">{stats.max.toFixed(0)}%</h3>
             </div>
           </div>
            <div className="text-sm text-gray-500">Lowest: {stats.min.toFixed(0)}%</div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
             <div className="flex justify-between items-start mb-2">
             <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">T-Test (vs 50%)</p>
              <h3 className="text-2xl font-bold text-gray-900">t={stats.tValue.toFixed(2)}</h3>
             </div>
             <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
              <AlertCircle className="w-5 h-5" />
            </div>
           </div>
            <div className="text-sm text-gray-500">p-value: {stats.pValue < 0.001 ? '< 0.001' : stats.pValue.toFixed(3)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Score Distribution</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 12}} />
                        <YAxis allowDecimals={false} />
                        <Tooltip 
                            cursor={{fill: '#f3f4f6'}}
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                        />
                        <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                            {distributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`rgba(79, 70, 229, ${0.4 + (index * 0.15)})`} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Student List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Student Leaderboard</h3>
            <div className="overflow-y-auto max-h-64 space-y-3">
                {results.map((res, idx) => (
                    <div key={res.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                        <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'}`}>
                                {idx + 1}
                            </span>
                            <span className="font-medium text-gray-700 truncate max-w-[120px]">{res.studentName}</span>
                        </div>
                        <div className="text-right">
                            <span className="block font-bold text-indigo-600">{res.score}/{exam.questions.length}</span>
                            <span className="text-xs text-gray-400">{((res.score / exam.questions.length) * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
      
      {/* Advanced Stats Details */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Advanced Statistics Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
                <span className="block text-gray-500">Standard Deviation (σ)</span>
                <span className="font-mono font-medium text-lg">{stats.stdDev.toFixed(4)}</span>
                <p className="text-xs text-gray-400 mt-1">Measures the amount of variation of the scores.</p>
            </div>
            <div>
                <span className="block text-gray-500">Median Score</span>
                <span className="font-mono font-medium text-lg">{stats.median.toFixed(2)}%</span>
                <p className="text-xs text-gray-400 mt-1">Middle value separating higher and lower halves.</p>
            </div>
             <div>
                <span className="block text-gray-500">Mode Score</span>
                <span className="font-mono font-medium text-lg">{stats.mode.toFixed(2)}%</span>
                <p className="text-xs text-gray-400 mt-1">The value that appears most often.</p>
            </div>
            <div>
                <span className="block text-gray-500">Significance (P-Value)</span>
                <span className={`font-mono font-medium text-lg ${stats.pValue < 0.05 ? 'text-green-600' : 'text-gray-600'}`}>
                    {stats.pValue < 0.0001 ? '< 0.0001' : stats.pValue.toFixed(4)}
                </span>
                <p className="text-xs text-gray-400 mt-1">
                    {stats.pValue < 0.05 ? 'Statistically significant difference from random guessing.' : 'Not statistically significant.'}
                </p>
            </div>
          </div>
      </div>
    </div>
  );
};

export default StatsView;