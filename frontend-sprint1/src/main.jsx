/**
 * Entry Point of the React Application
 *
 * This file is responsible for finding the 'root' element in the HTML
 * and mounting the React application into it.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // Import global CSS styles
import App from './App.jsx' // Import the main Application Component

// Find the DOM element with id 'root'
const rootElement = document.getElementById('root');

// Create a React root and render the App component
createRoot(rootElement).render(
  <StrictMode>
    {/* StrictMode activates additional checks and warnings for descendants during development. */}
    <App />
  </StrictMode>,
)
