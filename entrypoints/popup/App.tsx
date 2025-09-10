import { useState } from 'react';
import reactLogo from '@/assets/react.svg';
import wxtLogo from '/wxt.svg';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <div className="flex gap-8 mb-8">
        <a href="https://wxt.dev" target="_blank" className="block transition-transform hover:scale-110">
          <img src={wxtLogo} className="logo w-24 h-24" alt="WXT logo" />
        </a>
        <a href="https://react.dev" target="_blank" className="block transition-transform hover:scale-110">
          <img src={reactLogo} className="logo react w-24 h-24" alt="React logo" />
        </a>
      </div>
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        WXT + React + Tailwind
      </h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <button 
          onClick={() => setCount((count) => count + 1)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition-colors duration-200 mb-4"
        >
          count is {count}
        </button>
        <p className="text-gray-300 text-center">
          Edit <code className="bg-gray-700 px-2 py-1 rounded text-sm">entrypoints/popup/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="text-gray-400 mt-8 text-center">
        Click on the WXT and React logos to learn more
      </p>
    </div>
  );
}

export default App;
