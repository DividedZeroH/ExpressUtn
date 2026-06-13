// src/app.js
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import session from 'express-session';
import ConnectSessionSequelize from 'connect-session-sequelize';
import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import AdminJSSequelize from '@adminjs/sequelize';

const { sequelize } = await import('./models/index.js');
import adminConfig from './admin/index.js';
import apiRouter from './modules/index.js';
import errorHandler from './shared/errorHandler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

AdminJS.registerAdapter(AdminJSSequelize);

const app = express();
const PORT = process.env.PORT || 3000;

const SequelizeStore = ConnectSessionSequelize(session.Store);
const sessionStore = new SequelizeStore({ db: sequelize });

const start = async () => {
  try {
    const adminJs = new AdminJS(adminConfig);
    await sessionStore.sync();

    const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
      adminJs,
      {
        authenticate: async (email, password) => {
          if (
            email === process.env.ADMIN_EMAIL &&
            password === process.env.ADMIN_PASSWORD
          ) {
            return { email };
          }
          return null;
        },
        cookieName: 'adminjs',
        cookiePassword: process.env.ADMIN_PASSWORD || 'secreto-cambiar-en-produccion',
      },
      null,
      {
        store: sessionStore,
        resave: false,
        saveUninitialized: true,
        secret: process.env.ADMIN_PASSWORD || 'secreto-cambiar-en-produccion',
      }
    );

    app.use(adminJs.options.rootPath, adminRouter);
    app.use(express.static(join(__dirname, 'public')));

    // TODO: auth en /api
    // express.json() solo para /api — no interfiere con express-formidable de AdminJS
    app.use('/api', express.json(), apiRouter);

    app.get('/', (req, res) => {
      res.sendFile(join(__dirname, 'public', 'index.html'));
    });

    // Middleware de errores — debe ir DESPUÉS de todas las rutas
    app.use(errorHandler);

    await sequelize.authenticate();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log(`Panel de administración en http://localhost:${PORT}/admin`);
    });
  } catch (err) {
    console.error('Error durante el inicio del servidor:', err.message);
    console.error(err);
    process.exit(1);
  }
};

start();
