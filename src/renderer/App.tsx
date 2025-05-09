import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './tailwind.css';
import 'flowbite';
import './App.css';
import Start from './pages/Start';
import ConvertUI from './pages/ConvertUI';
import { InputProvider } from './context/InputContext';
import { loader } from '@monaco-editor/react';
loader.config({ paths: { vs: 'monaco/vs' } });

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark w-screen h-screen flex flex-col items-center justify-start overflow-auto min-w-[800px] min-h-[500px]">
      {children}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <InputProvider>
        <PageWrapper>
          <Routes>
            <Route path="/" element={<Start />} />
            <Route path="/convert" element={<ConvertUI />} />
          </Routes>
        </PageWrapper>
      </InputProvider>
    </Router>
  );
}
