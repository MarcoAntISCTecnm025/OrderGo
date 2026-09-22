import React, { useState } from 'react';
import api from '../services/api';
import { ChefHat, Search, Lock, User, ArrowRight, CheckCircle2, Clock, Truck, Utensils, ShieldCheck } from 'lucide-react';

export default function LandingPage({ onLoginSuccess }) {
    const [activeTab, setActiveTab] = useState('inicio');

    // Estados para Rastreo de Clientes
    const [searchQuery, setSearchQuery] = useState('');
    const [orderResult, setOrderResult] = useState(null);
    const [searchError, setSearchError] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Estados para Login (Cajero / Gerente)
    const [loginRole, setLoginRole] = useState('cajero'); // 'cajero' o 'gerente'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    const handleTrackOrder = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setSearchError('');
        setOrderResult(null);

        try {
            const response = await api.get(`/orders/track/${searchQuery.trim()}`);
            if (response.data.success && response.data.data) {
                setOrderResult(response.data.data);
            } else {
                setSearchError('No se encontró ningún pedido con ese número.');
            }
        } catch (err) {
            console.error('Error al rastrear pedido:', err);
            setSearchError('Pedido no encontrado o código incorrecto. Verifica e intenta de nuevo.');
        } finally {
            setIsSearching(false);
        }
    };

    // Conectado con tu endpoint /auth/login del backend
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');
        try {
            const response = await api.post('/auth/login', { username, password });
            if (response.data.success) {
                // response.data incluye el token y los datos del usuario con su rol real desde Firestore
                onLoginSuccess(response.data);
            }
        } catch (err) {
            console.error('Error de autenticación:', err);
            setLoginError('Credenciales inválidas. Verifica tu usuario y contraseña.');
        }
    };

    return (
        <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh', fontFamily: 'Roboto, Inter, sans-serif', display: 'flex', flexDirection: 'column', color: '#2D3748' }}>
            
            {/* Header / Barra de Navegación */}
            <header style={{ 
                backgroundColor: '#1B4965', 
                color: '#FFFFFF', 
                padding: '12px 32px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                        src="/OGlogo.png" 
                        alt="OrderGo Logo" 
                        style={{ height: '45px', objectFit: 'contain' }} 
                    />
                </div>

                <nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button 
                        onClick={() => setActiveTab('inicio')}
                        style={{ background: activeTab === 'inicio' ? 'rgba(255,255,255,0.15)' : 'transparent', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}
                    >
                        Inicio
                    </button>
                    <button 
                        onClick={() => setActiveTab('rastreo')}
                        style={{ background: activeTab === 'rastreo' ? 'rgba(255,255,255,0.15)' : 'transparent', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}
                    >
                        Rastrear Pedido
                    </button>
                    <button 
                        onClick={() => setActiveTab('login')}
                        style={{ backgroundColor: '#FF6B35', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                    >
                        Acceso Sistema
                    </button>
                </nav>
            </header>

            <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                
                {/* 1. SECCIÓN INICIO */}
                {activeTab === 'inicio' && (
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <div style={{ 
                            background: 'linear-gradient(135deg, #1B4965 0%, #12354A 100%)', 
                            color: 'white', 
                            padding: '80px 20px', 
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '20px'
                        }}>
                            <span style={{ backgroundColor: 'rgba(255, 107, 53, 0.2)', color: '#FF6B35', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', border: '1px solid #FF6B35' }}>
                                Solución en Cadereyta de Montes
                            </span>
                            <h2 style={{ fontSize: '40px', fontWeight: '800', maxWidth: '800px', lineHeight: '1.2', margin: 0 }}>
                                Plataforma web integral para gestión de pedidos
                            </h2>
                            <p style={{ fontSize: '18px', maxWidth: '650px', opacity: 0.9, margin: 0, fontWeight: '300' }}>
                                Optimiza la cocina, controla tus entregas a domicilio, mesas en local y administra las finanzas de tu negocio gastronómico.
                            </p>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                                <button 
                                    onClick={() => setActiveTab('rastreo')}
                                    style={{ backgroundColor: '#FF6B35', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    Rastrear mi Pedido <ArrowRight size={18} />
                                </button>
                                <button 
                                    onClick={() => setActiveTab('login')}
                                    style={{ backgroundColor: 'transparent', color: 'white', border: '2px solid white', padding: '12px 24px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    Iniciar Sesión 
                                </button>
                            </div>
                        </div>

                        {/* Features Grid */}
                        <div style={{ maxWidth: '1100px', margin: '60px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
                            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderTop: '4px solid #FF6B35' }}>
                                <div style={{ backgroundColor: '#FFF3E0', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                    <Clock size={24} color="#FF6B35" />
                                </div>
                                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1B4965', marginBottom: '10px' }}>Control de Cocina KDS</h3>
                                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.5', margin: 0 }}>
                                    Visualiza comandas en tiempo real organizadas por estatus (Pendientes, En Preparación, En Ruta, Entregados).
                                </p>
                            </div>

                            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderTop: '4px solid #1B4965' }}>
                                <div style={{ backgroundColor: '#E3F2FD', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                    <Truck size={24} color="#1565C0" />
                                </div>
                                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1B4965', marginBottom: '10px' }}>Domicilios y Locales</h3>
                                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.5', margin: 0 }}>
                                    Administra tanto pedidos para llevar/envío con dirección exacta, como consumos directos en mesa dentro del establecimiento.
                                </p>
                            </div>

                            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderTop: '4px solid #2E7D32' }}>
                                <div style={{ backgroundColor: '#E8F5E9', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                    <ShieldCheck size={24} color="#2E7D32" />
                                </div>
                                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1B4965', marginBottom: '10px' }}>Gestión Gerencial</h3>
                                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.5', margin: 0 }}>
                                    Reportes automatizados, control de cortes de caja y métricas clave de ventas diseñadas exclusivamente para administradores.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. SECCIÓN RASTREO DE PEDIDOS */}
                {activeTab === 'rastreo' && (
                    <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 20px' }}>
                        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '500px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                <div style={{ backgroundColor: '#FFF3E0', width: '60px', height: '60px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                                    <Search size={28} color="#FF6B35" />
                                </div>
                                <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1B4965', margin: 0 }}>Rastrea tu Pedido</h2>
                                <p style={{ fontSize: '13px', color: '#64748B', marginTop: '6px' }}>Ingresa tu número de orden para conocer su estatus en tiempo real.</p>
                            </div>

                            <form onSubmit={handleTrackOrder} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Ej. 1042 o ID de orden"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ flexGrow: '1', padding: '12px', border: '1px solid #CBD5E0', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                                />
                                <button 
                                    type="submit"
                                    disabled={isSearching}
                                    style={{ backgroundColor: '#FF6B35', color: 'white', border: 'none', padding: '0 20px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                                >
                                    {isSearching ? 'Buscando...' : 'Buscar'}
                                </button>
                            </form>

                            {searchError && (
                                <div style={{ backgroundColor: '#FFEBEE', color: '#C62828', padding: '12px', borderRadius: '6px', fontSize: '13px', textAlign: 'center', marginBottom: '20px' }}>
                                    {searchError}
                                </div>
                            )}

                            {orderResult && (
                                <div style={{ backgroundColor: '#F8F9FA', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                                        <span style={{ fontWeight: '700', color: '#1B4965', fontSize: '16px' }}>
                                            Pedido #{orderResult.orderNumber || orderResult.id?.slice(-5)}
                                        </span>
                                        <span style={{ backgroundColor: '#E3F2FD', color: '#1565C0', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                                            {orderResult.status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px', color: '#4A5568' }}>
                                        <div><strong>Cliente:</strong> {orderResult.customerName}</div>
                                        <div><strong>Tipo:</strong> {orderResult.isDineIn ? '🍽️ En Local' : '🛵 A Domicilio'}</div>
                                        <div><strong>Total a Pagar:</strong> <span style={{ color: '#FF6B35', fontWeight: 'bold' }}>${orderResult.totalAmount}</span></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 3. SECCIÓN LOGIN (Integrado con username del backend) */}
                {activeTab === 'login' && (
                    <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 20px' }}>
                        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                <div style={{ backgroundColor: '#1B4965', width: '60px', height: '60px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.15)' }}>
                                    <Lock size={26} color="#FF6B35" />
                                </div>
                                <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1B4965', margin: 0 }}>Acceso al Sistema</h2>
                                <p style={{ fontSize: '13px', color: '#64748B', marginTop: '6px' }}>Ingresa tus credenciales asignadas.</p>
                            </div>

                            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#2D3748' }}>Nombre de Usuario</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Ej. cajero1 o admin"
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#2D3748' }}>Contraseña</label>
                                    <input 
                                        type="password" 
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                </div>

                                {loginError && (
                                    <div style={{ backgroundColor: '#FFEBEE', color: '#C62828', padding: '10px', borderRadius: '6px', fontSize: '12px', textAlign: 'center' }}>
                                        {loginError}
                                    </div>
                                )}

                                <button 
                                    type="submit"
                                    style={{ 
                                        backgroundColor: '#1B4965', 
                                        color: 'white', 
                                        border: 'none', 
                                        padding: '12px', 
                                        borderRadius: '6px', 
                                        fontWeight: '600', 
                                        cursor: 'pointer', 
                                        fontSize: '14px',
                                        marginTop: '10px',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    Iniciar Sesión
                                </button>
                            </form>
                        </div>
                    </div>
                )}

            </main>

            <footer style={{ backgroundColor: '#12354A', color: 'rgba(255,255,255,0.7)', padding: '20px', textAlign: 'center', fontSize: '13px' }}>
                <p style={{ margin: 0 }}>© 2026 OrderGo - Gestión Inteligente de Pedidos. Todos los derechos reservados. Cadereyta de Montes, Qro.</p>
            </footer>

        </div>
    );
}