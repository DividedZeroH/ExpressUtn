// src/app.js
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';

import apiRouter from './modules/index.js';
import errorHandler from './shared/errorHandler.js';
import { getRepositories } from './repositories/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;
const DRIVER = (process.env.DB_DRIVER || 'sequelize').toLowerCase();

// AdminJS soporta Sequelize (PostgreSQL) y Mongoose (MongoDB).
// Con otros drivers (ej: drizzle) el panel /admin no está disponible;
// la API REST sí funciona contra cualquier driver vía la capa de repositorios.
const ADMIN_HABILITADO = DRIVER === 'sequelize' || DRIVER === 'mongoose';

// ── Panel AdminJS (Sequelize / PostgreSQL) ────────────────────────────────────
// Se monta de forma dinámica para no cargar Sequelize ni AdminJS cuando se usa Mongo.
async function montarAdmin() {
  const session = (await import('express-session')).default;
  const ConnectSessionSequelize = (await import('connect-session-sequelize')).default;
  const AdminJS = (await import('adminjs')).default;
  const AdminJSExpress = (await import('@adminjs/express')).default;
  const AdminJSSequelize = await import('@adminjs/sequelize');
  const { sequelize } = await import('./models/index.js');
  const { default: adminConfig } = await import('./admin/index.js');

  AdminJS.registerAdapter(AdminJSSequelize);

  const SequelizeStore = ConnectSessionSequelize(session.Store);
  const sessionStore = new SequelizeStore({ db: sequelize });

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
  await sequelize.authenticate();
  return adminJs.options.rootPath;
}

// ── Panel AdminJS (Mongoose / MongoDB) ────────────────────────────────────────
// Adapter @adminjs/mongoose + session store en memoria (no hay PostgreSQL en este modo).
async function montarAdminMongoose() {
  const session = (await import('express-session')).default;
  const AdminJS = (await import('adminjs')).default;
  const AdminJSExpress = (await import('@adminjs/express')).default;
  const AdminJSMongoose = await import('@adminjs/mongoose');
  const { connectMongoose } = await import('./repositories/mongoose/connection.js');
  const { default: adminConfig } = await import('./admin/admin-mongoose.js');

  AdminJS.registerAdapter(AdminJSMongoose);
  await connectMongoose();

  const adminJs = new AdminJS(adminConfig);

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
      resave: false,
      saveUninitialized: true,
      secret: process.env.ADMIN_PASSWORD || 'secreto-cambiar-en-produccion',
    }
  );

  app.use(adminJs.options.rootPath, adminRouter);
  return adminJs.options.rootPath;
}

const start = async () => {
  try {
    let adminPath = null;

    if (DRIVER === 'sequelize') {
      adminPath = await montarAdmin();
    } else if (DRIVER === 'mongoose') {
      adminPath = await montarAdminMongoose();
      // También inicializa los repositorios Mongoose para la API REST.
      await getRepositories();
    } else {
      // Inicializa la capa de datos (abre la conexión del driver elegido).
      const repos = await getRepositories();
      console.log(`Panel /admin deshabilitado para driver "${repos.driver}" (solo Sequelize/Mongoose).`);
    }

    app.use(express.static(join(__dirname, 'public')));

    // TODO: auth en /api
    // express.json() solo para /api — no interfiere con express-formidable de AdminJS
    app.use('/api', express.json(), apiRouter);

    app.get('/', (req, res) => {
      res.sendFile(join(__dirname, 'public', 'index.html'));
    });

    // Middleware de errores — debe ir DESPUÉS de todas las rutas
    app.use(errorHandler);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor corriendo en http://localhost:${PORT} (driver: ${DRIVER})`);
      if (adminPath) {
        console.log(`Panel de administración en http://localhost:${PORT}${adminPath}`);
      }
    });
  } catch (err) {
    console.error('Error durante el inicio del servidor:', err.message);
    console.error(err);
    process.exit(1);
  }
};

start();
