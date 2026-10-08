import { recoverHomeBusinessTransfer } from './utils/homeBusinessStorage';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

let ready = true;
try {
  recoverHomeBusinessTransfer(localStorage);
} catch (error) {
  ready = false;
  const root = document.getElementById('root')!;
  root.setAttribute('role', 'alert');
  root.textContent =
    'Não foi possível recuperar uma transferência Business/Home. Os dados foram preservados. Verifica o armazenamento do navegador e recarrega.';
}
if (ready)
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
