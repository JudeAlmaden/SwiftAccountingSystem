export type * from './auth';
export type * from './navigation';
export type * from './ui';
import type { User } from './auth';

export type SharedData = {
    name: string;
    user: User;
    csrf_token: string;
    sidebarOpen: boolean;
    [key: string]: unknown;
};
