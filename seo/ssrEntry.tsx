// Loaded by the build plugin through Vite's ssrLoadModule; never shipped to the browser.
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../App';
import { pages } from '../seoPages';

export { pages };

export const renderRoute = (_path: string): string => renderToString(<App />);
