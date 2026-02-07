import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import { initializeTheme } from './hooks/use-appearance';
import { configureEcho } from '@laravel/echo-react';
import axios from 'axios';
import Pusher from 'pusher-js';

// window.Pusher = Pusher;
// axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
// window.axios = axios;

// const pusherClient = new Pusher(import.meta.env.VITE_REVERB_APP_KEY, {
//     wsHost: import.meta.env.VITE_REVERB_HOST,
//     wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
//     wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
//     forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
//     enabledTransports: ['ws', 'wss'],
//     cluster: 'mt1',
//     disableStats: true,
//     authEndpoint: '/broadcasting/auth',
// });

// // Add connection logging
// pusherClient.connection.bind('connected', () => {
//     console.log('[Pusher] ✓ Connected to Reverb');
// });

// pusherClient.connection.bind('error', (err: any) => {
//     console.error('[Pusher] ✗ Connection error:', err);
// });

// pusherClient.connection.bind('disconnected', () => {
//     console.warn('[Pusher] Disconnected from Reverb');
// });

// configureEcho({
//     broadcaster: 'reverb',
//     key: import.meta.env.VITE_REVERB_APP_KEY,
//     wsHost: import.meta.env.VITE_REVERB_HOST,
//     wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
//     wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
//     forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
//     enabledTransports: ['ws', 'wss'],
//     client: pusherClient
// });

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
