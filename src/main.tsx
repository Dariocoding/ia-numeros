import React from 'react';
import ReactDOM from 'react-dom/client';
import RootApp from './components/RootApp';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<RootApp />
	</React.StrictMode>
);
