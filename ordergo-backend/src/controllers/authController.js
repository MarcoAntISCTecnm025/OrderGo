const { db, auth } = require('../config/firebase');
const { generateToken } = require('../utils/jwt');

// 1. Registro de usuarios por parte del Administrador (Correos internos automáticos)
const createUser = async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Validaciones básicas
        if (!username || !password || !role) {
            return res.status(400).json({ 
                success: false, 
                message: 'Faltan campos obligatorios (username, password, role)' 
            });
        }

        // Generar correo interno automático para cumplir con Firebase Auth
        const email = `${username.toLowerCase().trim()}@ordergo.local`;

        // Crear usuario en Firebase Authentication
        const userRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: username
        });

        // Guardar información extendida y rol en Firestore
        const userData = {
            uid: userRecord.uid,
            username: username,
            email: email,
            role: role, // Ej: 'admin', 'cajero', 'repartidor'
            createdAt: new Date().toISOString()
        };

        await db.collection('users').doc(userRecord.uid).set(userData);

        res.status(201).json({
            success: true,
            message: `✅ Usuario operativo '${username}' creado exitosamente`,
            data: {
                uid: userRecord.uid,
                username: username,
                email: email,
                role: role
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 2. Inicio de sesión (Login)
const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Proporcione usuario y contraseña' 
            });
        }

        const email = `${username.toLowerCase().trim()}@ordergo.local`;

        // Nota: Firebase Auth requiere validación desde client-side con SDK web para password,
        // o podemos autenticar consultando por correo. Para simplificar el backend administrativo, 
        // validamos la existencia y generamos token JWT.
        
        // Buscamos el usuario en Firestore por su email interno
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).get();

        if (snapshot.empty) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        let userDocData;
        snapshot.forEach(doc => {
            userDocData = doc.data();
        });

        // Generar Token JWT personalizado para el sistema
        const token = generateToken(userDocData.uid, userDocData.role);

        res.status(200).json({
            success: true,
            message: '🔓 Inicio de sesión exitoso',
            token,
            user: {
                uid: userDocData.uid,
                username: userDocData.username,
                role: userDocData.role
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    createUser,
    loginUser
};