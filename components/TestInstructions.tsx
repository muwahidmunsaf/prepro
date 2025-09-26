
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
// FIX: The useAppContext hook is exported from 'hooks/useAppContext', not from the context file.
import { useAppContext } from '../hooks/useAppContext';

const TestInstructions: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const { state } = useAppContext();
  const navigate = useNavigate();

  const test = state.tests.find(t => t.id === testId);

  if (!test) {
    return <div className="text-center text-red-500">Test not found.</div>;
  }

  const handleStartTest = () => {
    navigate(`/test/${test.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg text-center">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">{test.title}</h1>
      <h2 className="text-xl font-semibold text-indigo-600 mb-6">Test Instructions</h2>
      
      <div className="text-left space-y-4 text-slate-600 dark:text-slate-300 mb-8">
        <p><strong>Duration:</strong> {test.duration} minutes</p>
        <p><strong>Number of Questions:</strong> {test.totalQuestions}</p>
        <p>This is a multiple-choice question test. Please read each question carefully and select the best answer.</p>
        <p className="font-bold text-red-500">Important:</p>
        <ul className="list-disc list-inside space-y-2 pl-4">
            <li>The test will be submitted automatically when the timer runs out.</li>
            <li>Do not minimize the browser window or switch to another tab.</li>
            <li>Any attempt to leave the test page will result in the test being automatically canceled.</li>
        </ul>
      </div>

      <div className="flex justify-center space-x-4">
        <Link to="/tests" className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 px-8 rounded-lg">
          Back
        </Link>
        <button 
          onClick={handleStartTest}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105"
        >
          Start Test
        </button>
      </div>
    </div>
  );
};

export default TestInstructions;
