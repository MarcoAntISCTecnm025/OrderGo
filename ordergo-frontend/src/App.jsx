import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import KitchenView from './pages/KitchenView';
import AdminView from './pages/AdminView';

export default function App() {
    // Estado para saber qué vista mostrar ('landing', 'kitchen', 'admin')
    const [currentView, setCurrentView] = useState('landing');
    const [userRole, setUserRole] = useState(null);

    // Función que se ejecuta cuando el login es exitoso desde la LandingPage
    const handleLoginSuccess = (userData) => {
        console.log("Datos recibidos del login:", userData); // <-- Abre la consola del navegador (F12) para ver esto

        // Buscamos el rol ya sea directo o dentro de la propiedad user
        const rol = userData.role || (userData.user && userData.user.role);
        
        setUserRole(rol); 
        
        if (rol === 'gerente') {
            setCurrentView('admin');
        } else {
            setCurrentView('kitchen');
        }
    };

    return (
        <div>
            {currentView === 'landing' && (
                <LandingPage onLoginSuccess={handleLoginSuccess} />
            )}

            {currentView === 'kitchen' && (
                <KitchenView onLogout={() => setCurrentView('landing')} />
            )}

            {currentView === 'admin' && (
                <AdminView onLogout={() => setCurrentView('landing')} />
            )}
        </div>
    );
}