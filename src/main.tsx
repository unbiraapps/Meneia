import './styles.css';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';

async function start() {
  // Compilación para capturas: carga datos inventados antes de abrir la app
  if (import.meta.env.VITE_DEMO === '1') { const { seedDemo } = await import('./demo'); await seedDemo(); }
  createRoot(document.getElementById('root')!).render(<App />);
}
start();
