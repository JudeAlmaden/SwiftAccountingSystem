/// <reference types="vite/client" />
import type { AxiosInstance } from "axios";

declare global {
    interface Window {
        axios: AxiosInstance;
        Pusher: any;
    }
}
