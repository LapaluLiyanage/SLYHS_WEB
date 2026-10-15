import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { adoptEmailLink } from './lib/adminApi';
import './styles/base.css';
import './styles/join.css';
import './styles/app.css';
import './styles/species.css';
import './styles/people.css';
import './styles/mobile.css';

adoptEmailLink(); // invite / reset links arrive as #access_token=… on any page

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
