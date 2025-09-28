import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import * as supabaseService from '../services/supabaseService';
import type { TestSubject } from '../types';

interface SubjectManagerProps {
  testId: string;
  testTitle: string;
  onClose: () => void;
}

interface CSVQuestion {
  questionText: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctAnswer: number;
  difficulty: string;
}

const SubjectManager: React.FC<SubjectManagerProps> = ({ testId, testTitle, onClose }) => {
  const { state, dispatch } = useAppContext();
  const [subjects, setSubjects] = useState<TestSubject[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCount, setNewSubjectCount] = useState(1);
  const [editingSubject, setEditingSubject] = useState<TestSubject | null>(null);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [selectedSubjectForCSV, setSelectedSubjectForCSV] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actualQuestionCounts, setActualQuestionCounts] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load subjects for this test
  useEffect(() => {
    loadSubjects();
  }, [testId]);

  const loadSubjects = async () => {
    try {
      const testSubjects = await supabaseService.fetchTestSubjects(testId);
      setSubjects(testSubjects);
      dispatch({ type: 'SET_TEST_SUBJECTS', payload: testSubjects } as any);
      
      // Load actual question counts for each subject
      const counts: Record<string, number> = {};
      for (const subject of testSubjects) {
        try {
          const count = await supabaseService.fetchQuestionCountBySubject(testId, subject.subjectName);
          counts[subject.id] = count;
        } catch (error) {
          console.error(`Failed to load count for subject ${subject.subjectName}:`, error);
          counts[subject.id] = 0;
        }
      }
      setActualQuestionCounts(counts);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  };

  const addSubject = async () => {
    if (!newSubjectName.trim()) return;
    
    try {
      setIsLoading(true);
      const nextOrder = Math.max(...subjects.map(s => s.displayOrder), 0) + 1;
      const newSubject = await supabaseService.createTestSubject(
        testId, 
        newSubjectName.trim(), 
        newSubjectCount, 
        nextOrder
      );
      
      setSubjects(prev => [...prev, newSubject]);
      dispatch({ type: 'ADD_TEST_SUBJECT', payload: newSubject } as any);
      
      setNewSubjectName('');
      setNewSubjectCount(1);
    } catch (error) {
      console.error('Failed to add subject:', error);
      alert('Failed to add subject. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubject = async (subject: TestSubject) => {
    try {
      setIsLoading(true);
      const updatedSubject = await supabaseService.updateTestSubject(subject.id, subject);
      
      setSubjects(prev => prev.map(s => s.id === subject.id ? updatedSubject : s));
      dispatch({ type: 'UPDATE_TEST_SUBJECT', payload: updatedSubject } as any);
      
      setEditingSubject(null);
    } catch (error) {
      console.error('Failed to update subject:', error);
      alert('Failed to update subject. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSubject = async (subjectId: string) => {
    if (!confirm('Are you sure you want to delete this subject? This will also delete all questions in this subject.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      await supabaseService.deleteTestSubject(subjectId);
      
      setSubjects(prev => prev.filter(s => s.id !== subjectId));
      dispatch({ type: 'DELETE_TEST_SUBJECT', payload: subjectId } as any);
    } catch (error) {
      console.error('Failed to delete subject:', error);
      alert('Failed to delete subject. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex === dropIndex) return;
    
    const newSubjects = [...subjects];
    const draggedSubject = newSubjects[dragIndex];
    newSubjects.splice(dragIndex, 1);
    newSubjects.splice(dropIndex, 0, draggedSubject);
    
    // Update display orders
    const updatedSubjects = newSubjects.map((subject, index) => ({
      ...subject,
      displayOrder: index + 1
    }));
    
    setSubjects(updatedSubjects);
    
    try {
      await supabaseService.reorderTestSubjects(
        testId, 
        updatedSubjects.map(s => ({ id: s.id, displayOrder: s.displayOrder }))
      );
      
      dispatch({ type: 'SET_TEST_SUBJECTS', payload: updatedSubjects } as any);
    } catch (error) {
      console.error('Failed to reorder subjects:', error);
      alert('Failed to reorder subjects. Please try again.');
      loadSubjects(); // Reload to revert changes
    }
  };

  const parseCSV = (csvText: string): CSVQuestion[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    
    // Proper CSV parsing function that handles commas within quoted fields
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    };
    
    return lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      return {
        questionText: values[0] || '',
        option1: values[1] || '',
        option2: values[2] || '',
        option3: values[3] || '',
        option4: values[4] || '',
        correctAnswer: parseInt(values[5]) || 1,
        difficulty: 'Medium' // Default difficulty
      };
    });
  };

  const uploadCSV = async () => {
    if (!csvFile || !selectedSubjectForCSV) {
      alert('Please select both a subject and a CSV file.');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Starting CSV upload...', { csvFile: csvFile.name, subject: selectedSubjectForCSV });
      
      const text = await csvFile.text();
      console.log('CSV text loaded:', text.substring(0, 200) + '...');
      
      const questions = parseCSV(text);
      console.log('Parsed questions:', questions.length, questions);
      
      if (questions.length === 0) {
        alert('No valid questions found in CSV file. Please check the format.');
        return;
      }
      
      // Get the next position for this subject
      const subjectQuestions = state.questions.filter(q => q.testId === testId && q.subject === selectedSubjectForCSV);
      let nextPosition = Math.max(...subjectQuestions.map(q => q.position || 0), 0) + 1;
      
      console.log('Starting position for subject:', nextPosition);
      
      // Create questions
      let successCount = 0;
      for (const q of questions) {
        if (q.questionText.trim()) {
          console.log('Creating question:', q.questionText.substring(0, 50) + '...');
          await supabaseService.createQuestion({
            testId,
            questionText: q.questionText,
            options: [q.option1, q.option2, q.option3, q.option4],
            correctAnswer: q.correctAnswer - 1, // Convert to 0-based index
            subject: selectedSubjectForCSV,
            position: nextPosition++,
            difficulty: q.difficulty
          });
          successCount++;
        }
      }
      
      console.log('Upload completed. Success count:', successCount);
      alert(`Successfully uploaded ${successCount} questions to ${selectedSubjectForCSV}!`);
      
      // Reset form
      setShowCSVUpload(false);
      setCsvFile(null);
      setSelectedSubjectForCSV('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Refresh questions in context
      const updatedQuestions = await supabaseService.fetchQuestionsByTestId(testId);
      dispatch({ type: 'BULK_ADD_QUESTIONS', payload: updatedQuestions } as any);
      
      // Refresh actual question counts
      await loadSubjects();
      
    } catch (error) {
      console.error('Failed to upload CSV:', error);
      alert(`Failed to upload CSV: ${error.message || 'Please check the format and try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const totalQuestions = subjects.reduce((sum, subject) => sum + subject.questionCount, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-600">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Subject Management: {testTitle}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Total Questions: {totalQuestions} | Subjects: {subjects.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Add New Subject */}
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Add New Subject</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g., English, Computer, General Knowledge"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-600 dark:text-white"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Question Count
                </label>
                <input
                  type="number"
                  min="1"
                  value={newSubjectCount}
                  onChange={(e) => setNewSubjectCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-600 dark:text-white"
                />
              </div>
              <button
                onClick={addSubject}
                disabled={isLoading || !newSubjectName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Adding...' : 'Add Subject'}
              </button>
            </div>
          </div>

          {/* CSV Upload */}
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Bulk Upload Questions</h3>
              <button
                onClick={() => setShowCSVUpload(!showCSVUpload)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                {showCSVUpload ? 'Hide' : 'Show'} CSV Upload
              </button>
            </div>
            
            {showCSVUpload && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Select Subject
                  </label>
                  <select
                    value={selectedSubjectForCSV}
                    onChange={(e) => setSelectedSubjectForCSV(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-600 dark:text-white"
                  >
                    <option value="">Select a subject</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.subjectName}>
                        {subject.subjectName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    CSV File
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-600 dark:text-white"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    CSV format: "Question", "Option1", "Option2", "Option3", "Option4", CorrectAnswer(1-4)<br/>
                    <span className="text-yellow-600">Tip: Use quotes around fields containing commas</span>
                  </p>
                </div>
                
                <button
                  onClick={uploadCSV}
                  disabled={isLoading || !csvFile || !selectedSubjectForCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Uploading...' : 'Upload CSV'}
                </button>
              </div>
            )}
          </div>

          {/* Subjects List */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Subjects ({subjects.length})</h3>
            
            {subjects.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No subjects added yet. Add your first subject above.
              </div>
            ) : (
              <div className="space-y-3">
                {subjects
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((subject, index) => (
                    <div
                      key={subject.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-4 cursor-move transition-all ${
                        dragOverIndex === index ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-slate-400 dark:text-slate-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                          </div>
                          
                          {editingSubject?.id === subject.id ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={editingSubject.subjectName}
                                onChange={(e) => setEditingSubject({...editingSubject, subjectName: e.target.value})}
                                className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded dark:bg-slate-600 dark:text-white"
                              />
                              <input
                                type="number"
                                min="0"
                                value={editingSubject.questionCount}
                                onChange={(e) => setEditingSubject({...editingSubject, questionCount: parseInt(e.target.value) || 0})}
                                className="w-20 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded dark:bg-slate-600 dark:text-white"
                              />
                              <button
                                onClick={() => updateSubject(editingSubject)}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingSubject(null)}
                                className="px-3 py-1 bg-slate-600 text-white rounded text-sm hover:bg-slate-700"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div>
                              <h4 className="font-semibold text-slate-800 dark:text-white">
                                {subject.subjectName}
                              </h4>
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                Target: {subject.questionCount} • Uploaded: {actualQuestionCounts[subject.id] || 0} • Order: {subject.displayOrder}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {editingSubject?.id !== subject.id && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setEditingSubject(subject)}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteSubject(subject.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectManager;
