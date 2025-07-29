
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Preload the AuthContext to prevent loading issues
import '@/contexts/AuthContext';

createRoot(document.getElementById("root")!).render(<App />);
