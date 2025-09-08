import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Ensure React is available globally for dependencies
(window as typeof window & { React: typeof React }).React = React;

createRoot(document.getElementById("root")!).render(<App />);
