import { io } from 'socket.io-client';

// Obtiene la URL base eliminando '/api' si existe, o usa localhost por defecto
const getSocketUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
        return apiUrl.replace(/\/api$/, '');
    }
    return 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();

export const socket = io(SOCKET_URL, {
    autoConnect: true,
    withCredentials: true,
});