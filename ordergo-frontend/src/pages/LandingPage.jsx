import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { io } from 'socket.io-client';
import { Search, Lock, ArrowRight, Clock, Truck, ShieldCheck, Mail, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';

export default function LandingPage({ onLoginSuccess }) {
    const [activeTab, setActiveTab] = useState('inicio');

    // Estados para Rastreo de Clientes con Sincronización en Vivo
    const [searchQuery, setSearchQuery] = useState('');
    const [orderResult, setOrderResult] = useState(null);
    const [searchError, setSearchError] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [socketInstance, setSocketInstance] = useState(null);

    // Estados para Login (Cajero / Gerente)
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    // Estados para el Formulario de Contacto (Fachada visual)
    const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
    const [isSendingContact, setIsSendingContact] = useState(false);
    const [contactStatus, setContactStatus] = useState({ success: false, message: '' });

    // Configurar Socket.io para escuchar cambios en tiempo real
    useEffect(() => {
        // Conectar al socket del backend (toma la URL base de tu servicio o la actual)
        const socketUrl = window.location.origin.includes('localhost') ? 'http://localhost:5000' : undefined;
        const newSocket = io(socketUrl);
        setSocketInstance(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // Escuchar eventos de actualización de pedidos cuando hay un resultado activo
    useEffect(() => {
        if (!socketInstance || !orderResult) return;

        const handleOrderUpdated = (updatedOrder) => {
            // Comparamos por ID o número de orden para saber si es el pedido actual que rastrea el cliente
            if (
                updatedOrder.id === orderResult.id || 
                updatedOrder.orderNumber === orderResult.orderNumber ||
                String(updatedOrder.orderNumber) === String(searchQuery.trim())
            ) {
                setOrderResult(updatedOrder);
            }
        };

        socketInstance.on('orderUpdated', handleOrderUpdated);
        socketInstance.on('orderStatusChanged', handleOrderUpdated);

        return () => {
            socketInstance.off('orderUpdated', handleOrderUpdated);
            socketInstance.off('orderStatusChanged', handleOrderUpdated);
        };
    }, [socketInstance, orderResult, searchQuery]);

    const handleTrackOrder = async (e) => {
        e.preventDefault();
        const query = searchQuery.trim();
        if (!query) return;
        
        setIsSearching(true);
        setSearchError('');
        setOrderResult(null);

        try {
            const response = await api.get('/orders');
            if (response.data.success) {
                const orders = response.data.data;
                const found = orders.find(o => 
                    String(o.orderNumber) === query || o.id === query
                );

                if (found) {
                    setOrderResult(found);
                    
                    const socket = io('http://localhost:5000');
                    socket.emit('join_order_room', found.id);
                    
                    socket.on('order_status_updated', (data) => {
                        if (data.orderId === found.id) {
                            setOrderResult(prev => ({ ...prev, status: data.status }));
                        }
                    });
                } else {
                    setSearchError('No se encontró ningún pedido con ese número.');
                }
            }
        } catch (error) {
            console.error('Error al conectar con el servidor:', error);
            setSearchError('No se pudo conectar con el servidor para rastrear el pedido. Verifique que esté encendido.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');
        try {
            const response = await api.post('/auth/login', { username, password });
            if (response.data.success) {
                onLoginSuccess(response.data);
            }
        } catch (err) {
            console.error('Error de autenticación:', err);
            setLoginError('Credenciales inválidas. Verifica tu usuario y contraseña.');
        }
    };

    // Envío simulado (fachada presentable) para el formulario de contacto
    const handleContactSubmit = (e) => {
        e.preventDefault();
        setIsSendingContact(true);
        setContactStatus({ success: false, message: '' });

        setTimeout(() => {
            setIsSendingContact(false);
            setContactStatus({ 
                success: true, 
                message: 'Su mensaje ha sido registrado correctamente. Nos pondremos en contacto a la brevedad.' 
            });
            setContactForm({ name: '', email: '', message: '' });
        }, 800);
    };

    return (
        <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh', fontFamily: 'Roboto, Inter, sans-serif', display: 'flex', flexDirection: 'column', color: '#2D3748' }}>
            
            {/* Header / Barra de Navegación */}
            <header style={{ 
                backgroundColor: '#1B4965', 
                color: '#FFFFFF', 
                padding: '16px 40px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setActiveTab('inicio')}>
                    <img 
                        src="/OGlogo.png" 
                        alt="OrderGo Logo" 
                        style={{ height: '40px', objectFit: 'contain' }} 
                    />
                </div>

                <nav style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {['inicio', 'rastreo', 'contacto', 'login'].map((tab) => {
                        const labels = { inicio: 'Inicio', rastreo: 'Rastrear Pedido', contacto: 'Contacto', login: 'Acceso Sistema' };
                        const isLogin = tab === 'login';
                        const isActive = activeTab === tab;

                        return (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{ 
                                    backgroundColor: isLogin ? '#FF6B35' : (isActive ? 'rgba(255,255,255,0.12)' : 'transparent'), 
                                    color: 'white', 
                                    border: isLogin ? 'none' : '1px solid transparent',
                                    padding: '8px 18px', 
                                    borderRadius: '6px', 
                                    cursor: 'pointer', 
                                    fontWeight: isLogin || isActive ? '600' : '500', 
                                    fontSize: '14px',
                                    transition: 'all 0.2s ease',
                                    boxShadow: isLogin ? '0 2px 6px rgba(255,107,53,0.3)' : 'none'
                                }}
                            >
                                {labels[tab]}
                            </button>
                        );
                    })}
                </nav>
            </header>

            <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                
                {/* 1. SECCIÓN INICIO */}
                {activeTab === 'inicio' && (
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <div style={{ 
                            background: 'linear-gradient(135deg, #1B4965 0%, #112A3A 100%)', 
                            color: 'white', 
                            padding: '90px 20px', 
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '24px'
                        }}>
                            <div style={{ backgroundColor: 'rgba(255, 107, 53, 0.15)', color: '#FF6B35', padding: '6px 16px', borderRadius: '30px', fontSize: '13px', fontWeight: '700', border: '1px solid rgba(255, 107, 53, 0.4)' }}>
                                Cadereyta de Montes, Qro.
                            </div>

                            <h1 style={{ fontSize: '44px', fontWeight: '800', maxWidth: '850px', lineHeight: '1.15', margin: 0, letterSpacing: '-0.5px' }}>
                                El sistema operativo definitivo para su negocio gastronómico
                            </h1>

                            <p style={{ fontSize: '17px', maxWidth: '680px', opacity: 0.85, margin: 0, lineHeight: '1.6', fontWeight: '300' }}>
                                Controle comandas de cocina en tiempo real, administre entregas a domicilio, mesas locales y optimice las finanzas de forma intuitiva.
                            </p>

                            <div style={{ display: 'flex', gap: '14px', marginTop: '10px' }}>
                                <button 
                                    onClick={() => setActiveTab('rastreo')}
                                    style={{ backgroundColor: '#FF6B35', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(255,107,53,0.3)' }}
                                >
                                    Rastrear Pedido <ArrowRight size={18} />
                                </button>
                                <button 
                                    onClick={() => setActiveTab('contacto')}
                                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '14px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    Contáctanos
                                </button>
                            </div>
                        </div>

                        {/* Tarjetas de Características */}
                        <div style={{ maxWidth: '1150px', margin: '-40px auto 60px auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', width: '100%', boxSizing: 'border-box', position: 'relative', zIndex: 2 }}>
                            <div style={{ backgroundColor: 'white', padding: '36px 30px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', border: '1px solid #EDF2F7', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ backgroundColor: '#FFF3E0', width: '52px', height: '52px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Clock size={26} color="#FF6B35" />
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1B4965', margin: 0 }}>Cocina KDS en Vivo</h3>
                                <p style={{ fontSize: '14px', color: '#718096', lineHeight: '1.6', margin: 0 }}>
                                    Visualice comandas al instante organizadas por estatus: pendientes, en preparación, listas y entregadas.
                                </p>
                            </div>

                            <div style={{ backgroundColor: 'white', padding: '36px 30px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', border: '1px solid #EDF2F7', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ backgroundColor: '#E3F2FD', width: '52px', height: '52px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Truck size={26} color="#1565C0" />
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1B4965', margin: 0 }}>Domicilios y Mesas</h3>
                                <p style={{ fontSize: '14px', color: '#718096', lineHeight: '1.6', margin: 0 }}>
                                    Gestione pedidos para llevar con direcciones exactas o el consumo interno por mesa de forma ágil y ordenada.
                                </p>
                            </div>

                            <div style={{ backgroundColor: 'white', padding: '36px 30px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', border: '1px solid #EDF2F7', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ backgroundColor: '#E8F5E9', width: '52px', height: '52px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ShieldCheck size={26} color="#2E7D32" />
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1B4965', margin: 0 }}>Cortes y Gerencia</h3>
                                <p style={{ fontSize: '14px', color: '#718096', lineHeight: '1.6', margin: 0 }}>
                                    Reportes automáticos, control estricto de caja por turnos y métricas financieras diseñadas para administradores.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. SECCIÓN RASTREO DE PEDIDOS CON SINCRONIZACIÓN EN VIVO */}
                {activeTab === 'rastreo' && (
                    <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 20px' }}>
                        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '520px', boxShadow: '0 12px 32px rgba(0,0,0,0.08)', border: '1px solid #EDF2F7' }}>
                            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                                <div style={{ backgroundColor: '#FFF3E0', width: '64px', height: '64px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                                    <Search size={30} color="#FF6B35" />
                                </div>
                                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1B4965', margin: 0 }}>Rastree su Pedido</h2>
                                <p style={{ fontSize: '14px', color: '#718096', marginTop: '6px' }}>Ingrese su número de orden para conocer su estatus en tiempo real.</p>
                            </div>

                            <form onSubmit={handleTrackOrder} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Ej. 1001 o ID de orden"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ flexGrow: '1', padding: '12px 16px', border: '1px solid #CBD5E0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                                />
                                <button 
                                    type="submit"
                                    disabled={isSearching}
                                    style={{ backgroundColor: '#FF6B35', color: 'white', border: 'none', padding: '0 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                                >
                                    {isSearching ? 'Buscando...' : 'Buscar'}
                                </button>
                            </form>

                            {searchError && (
                                <div style={{ backgroundColor: '#FFEBEE', color: '#C62828', padding: '14px', borderRadius: '8px', fontSize: '13px', textAlign: 'center', marginBottom: '20px', fontWeight: '500' }}>
                                    {searchError}
                                </div>
                            )}

                            {orderResult && (
                                <div style={{ backgroundColor: '#F8F9FA', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '20px', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
                                        <span style={{ fontWeight: '700', color: '#1B4965', fontSize: '16px' }}>
                                            Pedido #{orderResult.orderNumber || orderResult.id?.slice(-5)}
                                        </span>
                                        <span style={{ backgroundColor: '#E3F2FD', color: '#1565C0', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <RefreshCw size={12} className="fa-spin" /> {orderResult.status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#4A5568' }}>
                                        <div><strong>Cliente:</strong> {orderResult.customerName || orderResult.clientName || 'General'}</div>
                                        <div><strong>Tipo:</strong> {orderResult.isDineIn ? 'En Local' : 'A Domicilio'}</div>
                                        <div><strong>Total a Pagar:</strong> <span style={{ color: '#FF6B35', fontWeight: 'bold' }}>${orderResult.totalAmount || orderResult.total}</span></div>
                                    </div>
                                    <div style={{ marginTop: '14px', fontSize: '11px', color: '#38A169', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontWeight: '600' }}>
                                        ● Sincronizado en tiempo real con cocina y caja
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 3. SECCIÓN DE CONTACTO */}
                {activeTab === 'contacto' && (
                    <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 20px' }}>
                        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '600px', boxShadow: '0 12px 32px rgba(0,0,0,0.08)', border: '1px solid #EDF2F7' }}>
                            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                                <div style={{ backgroundColor: '#E3F2FD', width: '64px', height: '64px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                                    <Mail size={30} color="#1565C0" />
                                </div>
                                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1B4965', margin: 0 }}>Póngase en Contacto</h2>
                                <p style={{ fontSize: '14px', color: '#718096', marginTop: '6px' }}>¿Dudas sobre el sistema o soporte técnico? Envíenos un mensaje o visítenos en redes sociales.</p>
                            </div>

                            {contactStatus.message && (
                                <div style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '14px', borderRadius: '8px', fontSize: '14px', textAlign: 'center', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600' }}>
                                    <CheckCircle size={18} /> {contactStatus.message}
                                </div>
                            )}

                            <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#4A5568' }}>Nombre</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={contactForm.name}
                                            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                            placeholder="Nombre completo"
                                            style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#4A5568' }}>Correo Electrónico</label>
                                        <input 
                                            type="email" 
                                            required
                                            value={contactForm.email}
                                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                            placeholder="correo@ejemplo.com"
                                            style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#4A5568' }}>Mensaje</label>
                                    <textarea 
                                        rows="4"
                                        required
                                        value={contactForm.message}
                                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                        placeholder="Escriba su mensaje o solicitud aquí..."
                                        style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
                                    ></textarea>
                                </div>
                                <button 
                                    type="submit"
                                    disabled={isSendingContact}
                                    style={{ backgroundColor: '#1B4965', color: 'white', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(27,73,101,0.2)' }}
                                >
                                    {isSendingContact ? 'Procesando...' : 'Enviar Mensaje'}
                                </button>
                            </form>

                            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #EDF2F7', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', color: '#718096', textAlign: 'center' }}>
                                <div><strong>Correo institucional:</strong> l22141375@queretaro.tecnm.mx</div>
                                <div><strong>Ubicación:</strong> Cadereyta de Montes, Querétaro</div>
                                
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
                                    <a href="https://www.tiktok.com/@tecnmqro_cadereyta?_r=1&_t=ZS-99zFWWvqMHk" target="_blank" rel="noopener noreferrer" style={{ color: '#1B4965', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>TikTok <ExternalLink size={14} /></a>
                                    <a href="https://www.instagram.com/epadcade?stkn=MTF6ZXBpYW11M3FvYQ==" target="_blank" rel="noopener noreferrer" style={{ color: '#1B4965', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>Instagram <ExternalLink size={14} /></a>
                                    <a href="https://www.facebook.com/share/1MHaBg71SR/" target="_blank" rel="noopener noreferrer" style={{ color: '#1B4965', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>Facebook <ExternalLink size={14} /></a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. SECCIÓN LOGIN */}
                {activeTab === 'login' && (
                    <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 20px' }}>
                        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 12px 32px rgba(0,0,0,0.08)', border: '1px solid #EDF2F7' }}>
                            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                                <div style={{ backgroundColor: '#1B4965', width: '64px', height: '64px', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', boxShadow: '0 6px 16px rgba(27,73,101,0.25)' }}>
                                    <Lock size={26} color="#FF6B35" />
                                </div>
                                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1B4965', margin: 0 }}>Acceso al Sistema</h2>
                                <p style={{ fontSize: '14px', color: '#718096', marginTop: '6px' }}>Ingrese sus credenciales asignadas.</p>
                            </div>

                            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#4A5568' }}>Nombre de Usuario</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Ej. cajero1 o admin"
                                        style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#4A5568' }}>Contraseña</label>
                                    <input 
                                        type="password" 
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                </div>

                                {loginError && (
                                    <div style={{ backgroundColor: '#FFEBEE', color: '#C62828', padding: '12px', borderRadius: '8px', fontSize: '13px', textAlign: 'center', fontWeight: '500' }}>
                                        {loginError}
                                    </div>
                                )}

                                <button 
                                    type="submit"
                                    style={{ backgroundColor: '#1B4965', color: 'white', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '15px', marginTop: '6px', boxShadow: '0 4px 10px rgba(27,73,101,0.2)' }}
                                >
                                    Iniciar Sesión
                                </button>
                            </form>
                        </div>
                    </div>
                )}

            </main>

            <footer style={{ backgroundColor: '#112A3A', color: 'rgba(255,255,255,0.7)', padding: '24px', textAlign: 'center', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <a href="https://www.tiktok.com/@tecnmqro_cadereyta?_r=1&_t=ZS-99zFWWvqMHk" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '12px' }}>TikTok</a>
                    <a href="https://www.instagram.com/epadcade?stkn=MTF6ZXBpYW11M3FvYQ==" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '12px' }}>Instagram</a>
                    <a href="https://www.facebook.com/share/1MHaBg71SR/" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '12px' }}>Facebook</a>
                </div>
                <p style={{ margin: 0 }}>© 2026 OrderGo - Gestión Inteligente de Pedidos. Todos los derechos reservados. Cadereyta de Montes, Qro.</p>
            </footer>

        </div>
    );
}