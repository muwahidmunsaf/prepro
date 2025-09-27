import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../hooks/useAppContext';
import { CheckCircleIcon, XCircleIcon } from './icons';
import jsPDF from 'jspdf';

const ResultsPage: React.FC = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const { state } = useAppContext();

  const result = state.results.find(r => r.id === resultId);
  const test = state.tests.find(t => t.id === result?.testId);
  const resultOwner = state.users.find(u => u.id === result?.userId);
  const currentUser = state.currentUser;

  if (!result || !test) {
    return <div className="text-center">Result not found.</div>;
  }
  
  const percentage = Math.round((result.score / result.totalQuestions) * 100);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      // Create PDF with text content
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;
      const lineHeight = 7;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // Helper function to add text with word wrap
      const addText = (text: string, fontSize: number = 12, isBold: boolean = false, color: string = '#000000') => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        pdf.setTextColor(color);
        
        const lines = pdf.splitTextToSize(text, contentWidth);
        
        for (const line of lines) {
          if (yPosition + lineHeight > pageHeight - margin) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, margin, yPosition);
          yPosition += lineHeight;
        }
        yPosition += 2; // Add small spacing after text
      };

      // Add header
      addText('PrepPro Test Questions', 18, true);
      addText(`Test: ${test.title}`, 14, true);
      addText(`Date: ${new Date(result.date).toLocaleDateString()}`, 12);
      addText(`Score: ${result.score}/${result.totalQuestions} (${percentage}%)`, 12);
      yPosition += 10;

      // Add questions
      result.questions.forEach((question, index) => {
        const userAnswer = result.answers.find(a => a.questionId === question.id);
        const isCorrect = userAnswer?.selectedAnswer === question.correctAnswer;

        // Question number and text
        addText(`Question ${index + 1}:`, 14, true);
        addText(question.questionText, 12);
        yPosition += 3;

        // Options
        question.options.forEach((option, optIndex) => {
          const isSelected = userAnswer?.selectedAnswer === optIndex;
          const isCorrectAnswer = question.correctAnswer === optIndex;
          
          let optionText = `${String.fromCharCode(65 + optIndex)}. ${option}`;
          
          if (isCorrectAnswer) {
            // Bold the correct answer
            optionText = `${String.fromCharCode(65 + optIndex)}. ${option} (CORRECT ANSWER)`;
            addText(optionText, 12, true, '#16a34a'); // Green and bold
          } else if (isSelected) {
            // Show user's incorrect answer
            optionText = `${String.fromCharCode(65 + optIndex)}. ${option} (Your Answer)`;
            addText(optionText, 12, false, '#dc2626'); // Red
          } else {
            addText(optionText, 12);
          }
        });

        // Add result indicator
        if (isCorrect) {
          addText('✓ Correct', 12, true, '#16a34a');
        } else {
          addText('✗ Incorrect', 12, true, '#dc2626');
        }

        yPosition += 8; // Space between questions
      });

      // Add summary at the end
      yPosition += 10;
      addText('--- Test Summary ---', 14, true);
      addText(`Total Questions: ${result.totalQuestions}`, 12);
      addText(`Correct Answers: ${result.score}`, 12);
      addText(`Incorrect Answers: ${result.totalQuestions - result.score}`, 12);
      addText(`Percentage: ${percentage}%`, 12);
      addText(`Status: ${percentage >= 70 ? 'PASSED' : 'FAILED'}`, 12, true, percentage >= 70 ? '#16a34a' : '#dc2626');

      // Download the PDF
      const fileName = `PrepPro_Test_Questions_${test.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to print dialog
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 print-container">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only-block { display: block !important; }
          .print-container { max-width: none !important; }
          .print-container > div { box-shadow: none !important; border-radius: 0 !important; padding: 0 !important; }
          .print-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
          .print-correct { background-color: #dcfce7 !important; border-color: #16a34a !important; }
          .print-correct span { color: #16a34a !important; }
          .print-question { page-break-inside: avoid; margin-bottom: 12px !important; padding: 8px !important; }
          .print-question p { margin-bottom: 8px !important; font-size: 14px !important; }
          .print-option { padding: 4px 8px !important; margin-bottom: 2px !important; font-size: 12px !important; }
        }
        @media screen {
          .print-only-block { display: none !important; }
        }
      `}</style>
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
        {/* This header will only be visible on the printed page */}
        <div className="print-only-block mb-8 text-black">
            <h1 className="text-2xl font-bold">PrepPro Test Questions</h1>
            <p><strong>Test:</strong> {test.title}</p>
            <p><strong>Date:</strong> {new Date(result.date).toLocaleDateString()}</p>
        </div>

            <div className="no-print text-center border-b border-slate-200 dark:border-slate-700 pb-6 sm:pb-8 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-lg sm:text-2xl font-bold text-white">📊</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-white">Test Results</h1>
                  <h2 className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mt-1">{test.title}</h2>
                </div>
              </div>
            </div>
        
            <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 text-center mb-6 sm:mb-8">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-600 shadow-lg">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                      <span className="text-white font-bold text-sm sm:text-base">📝</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1 sm:mb-2">Score</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white">{result.score} / {result.totalQuestions}</p>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-600 shadow-lg">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 ${percentage >= 70 ? 'bg-green-500' : 'bg-red-500'}`}>
                      <span className="text-white font-bold text-sm sm:text-base">%</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1 sm:mb-2">Percentage</p>
                    <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${percentage >= 70 ? 'text-green-500' : 'text-red-500'}`}>{percentage}%</p>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-600 shadow-lg sm:col-span-2 lg:col-span-1">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 ${percentage >= 70 ? 'bg-green-500' : 'bg-red-500'}`}>
                      <span className="text-white font-bold text-sm sm:text-base">{percentage >= 70 ? '✓' : '✗'}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1 sm:mb-2">Status</p>
                    <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${percentage >= 70 ? 'text-green-500' : 'text-red-500'}`}>{percentage >= 70 ? 'Passed' : 'Failed'}</p>
                </div>
            </div>
        
            <div className="no-print flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6 sm:mb-8">
                <Link to={currentUser?.isAdmin ? "/admin" : "/dashboard"} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 sm:px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg text-center">
                    Dashboard
                </Link>
                <button onClick={handleDownloadPDF} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 sm:px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Download Questions PDF
                </button>
            </div>

            <div>
                <div className="no-print flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">Question Review</h3>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm sm:text-base">📋</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-black mb-4 print-only-block">Test Questions with Answers</h3>
                <div className="space-y-6">
                    {result.questions.map((q, index) => {
                        const userAnswer = result.answers.find(a => a.questionId === q.id);
                        const isCorrect = userAnswer?.selectedAnswer === q.correctAnswer;

                        return (
                                <div key={q.id} className="p-4 sm:p-6 border border-slate-200 dark:border-slate-700 rounded-xl print-question shadow-lg hover:shadow-xl transition-shadow duration-200" style={{ pageBreakInside: 'avoid' }}>
                                    <div className="flex flex-col sm:flex-row justify-between items-start mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                                        <div className="flex items-start space-x-3 flex-1">
                                            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                isCorrect 
                                                    ? 'bg-green-100 dark:bg-green-900/50' 
                                                    : 'bg-red-100 dark:bg-red-900/50'
                                            }`}>
                                                <span className={`text-xs sm:text-sm font-bold ${
                                                    isCorrect 
                                                        ? 'text-green-600 dark:text-green-400' 
                                                        : 'text-red-600 dark:text-red-400'
                                                }`}>
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <p className="font-semibold text-base sm:text-lg text-slate-800 dark:text-slate-100">{q.questionText}</p>
                                        </div>
                                        <span className="no-print flex-shrink-0">
                                            {isCorrect 
                                                ? <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" /> 
                                                : <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />}
                                        </span>
                                    </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 print-grid">
                                    {q.options.map((option, optIndex) => {
                                        const isSelected = userAnswer?.selectedAnswer === optIndex;
                                        const isCorrectAnswer = q.correctAnswer === optIndex;
                                        
                                        let optionClass = "p-3 border rounded-lg flex justify-between items-center text-left print-option";
                                        
                                        // For screen view, show all highlighting
                                        if (isCorrectAnswer) {
                                            optionClass += " bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700";
                                        } else if (isSelected) {
                                            optionClass += " bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700";
                                        } else {
                                            optionClass += " bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-600";
                                        }
                                        
                                        // For print, only highlight correct answers
                                        if (isCorrectAnswer) {
                                            optionClass += " print-correct";
                                        }

                                            return (
                                                <div key={optIndex} className={optionClass}>
                                                    <span className="text-slate-700 dark:text-slate-200 text-sm sm:text-base">{option}</span>
                                                    <div className="flex flex-col text-xs font-bold ml-2">
                                                        <span className="no-print">
                                                            {isSelected && <span className="text-red-600 dark:text-red-400">(Your Answer)</span>}
                                                            {isCorrectAnswer && <span className="text-green-600 dark:text-green-400">(Correct Answer)</span>}
                                                        </span>
                                                        <span className="print-only-block">
                                                            {isCorrectAnswer && <span className="text-green-600">(Correct Answer)</span>}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;