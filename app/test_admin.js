import AdminJS from 'adminjs';
import adminConfig from './src/admin/index.js';
import AdminJSSequelize from '@adminjs/sequelize';
AdminJS.registerAdapter(AdminJSSequelize);
const adminJs = new AdminJS(adminConfig);
console.log('Resources count:', adminJs.resources.length);
