import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './tailwind.css';
import 'flowbite';
import './App.css';
import React from 'react';
import Start from './pages/Start';
import ConvertUI from './pages/ConvertUI';
import { InputProvider } from './context/InputContext';
import { ToastProvider } from './context/ToastContext';

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
            <ToastProvider>
                <InputProvider>
                    <PageWrapper>
                        <Routes>
                            <Route path="/" element={<Start />} />
                            <Route path="/convert" element={<ConvertUI />} />
                        </Routes>
                    </PageWrapper>
                </InputProvider>
            </ToastProvider>
        </Router>
    );
}
