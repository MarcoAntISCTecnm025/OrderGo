const { auth, db } = require('./src/config/firebase'); 

async function crearUsuariosIniciales() {
    try {
        // 1. Crear el usuario Gerente
        const gerenteData = {
            username: 'admin',
            password: 'AdminPassword123!',
            role: 'gerente'
        };

        const emailGerente = `${gerenteData.username.toLowerCase().trim()}@ordergo.local`;
        
        try {
            const userRecordGerente = await auth.createUser({
                email: emailGerente,
                password: gerenteData.password,
                displayName: gerenteData.username
            });

            await db.collection('users').doc(userRecordGerente.uid).set({
                uid: userRecordGerente.uid,
                username: gerenteData.username,
                email: emailGerente,
                role: gerenteData.role,
                createdAt: new Date().toISOString()
            });
            console.log('✅ Gerente creado exitosamente:', emailGerente);
        } catch (err) {
            if (err.code === 'auth/email-already-exists') {
                console.log('⚠️ El usuario gerente ya existe en Auth, omitiendo creación.');
            } else {
                throw err;
            }
        }

        // 2. Crear el usuario Cajero
        const cajeroData = {
            username: 'cajero2',
            password: 'CajeroPassword123!',
            role: 'cajero'
        };

        const emailCajero = `${cajeroData.username.toLowerCase().trim()}@ordergo.local`;
        
        try {
            const userRecordCajero = await auth.createUser({
                email: emailCajero,
                password: cajeroData.password,
                displayName: cajeroData.username
            });

            await db.collection('users').doc(userRecordCajero.uid).set({
                uid: userRecordCajero.uid,
                username: cajeroData.username,
                email: emailCajero,
                role: cajeroData.role,
                createdAt: new Date().toISOString()
            });
            console.log('✅ Cajero creado exitosamente:', emailCajero);
        } catch (err) {
            if (err.code === 'auth/email-already-exists') {
                console.log('⚠️ El usuario cajero ya existe en Auth, omitiendo creación.');
            } else {
                throw err;
            }
        }

        console.log('🚀 Proceso de inicialización finalizado.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error inesperado:', error.message);
        process.exit(1);
    }
}

crearUsuariosIniciales();