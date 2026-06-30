// src/admin/admin-mongoose.js
//
// Configuración de AdminJS para el adapter de Mongoose.
// Espeja la config de Sequelize (index.js) pero referencia los modelos
// Mongoose de repositories/mongoose/schemas.js.

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ComponentLoader } from 'adminjs';
import {
  BarraModel,
  BebidaModel,
  VentaModel,
  DetalleVentaModel,
} from '../repositories/mongoose/schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const componentLoader = new ComponentLoader();

componentLoader.override('SidebarBranding', join(__dirname, 'components', 'custom-sidebar-branding.jsx'));
componentLoader.override('SidebarFooter',   join(__dirname, 'components', 'custom-sidebar-footer.jsx'));
componentLoader.override('TopBar',          join(__dirname, 'components', 'custom-top-bar.jsx'));

const Components = {
  Dashboard: componentLoader.add('Dashboard', join(__dirname, 'components', 'dashboard.jsx')),
};

// En Mongoose no hay errores de FK a nivel de BD como en PostgreSQL (código 23503).
// El handler captura cualquier error genérico.
const safeDelete = async (request, response, context) => {
  const { record, resource, h, currentAdmin } = context;
  const resourceId = resource._decorated?.id() ?? resource.id();
  const listUrl = h.resourceUrl({ resourceId });

  if (request.method !== 'post') {
    return { record: record.toJSON(currentAdmin) };
  }

  try {
    await resource.delete(record.id());
    return {
      record: record.toJSON(currentAdmin),
      redirectUrl: listUrl,
      notice: { message: 'Registro eliminado correctamente.', type: 'success' },
    };
  } catch (err) {
    return {
      record: record.toJSON(currentAdmin),
      redirectUrl: listUrl,
      notice: { message: `Error al eliminar: ${err.message}`, type: 'error' },
    };
  }
};

const deleteAction = {
  guard: '¿Estás seguro que querés eliminar este registro? Esta acción no se puede deshacer.',
  handler: safeDelete,
};

export default {
  rootPath: '/admin',
  componentLoader,
  dashboard: {
    component: Components.Dashboard,
  },
  resources: [
    // ── Maestros ───────────────────────────────────────────────────────────────
    {
      resource: BarraModel,
      options: {
        id: 'Barra',
        titleProperty: 'sector',
        navigation: { name: 'Maestros', icon: 'Coffee' },
        listProperties:   ['id', 'numero_barra', 'sector'],
        showProperties:   ['id', 'numero_barra', 'sector'],
        editProperties:   ['numero_barra', 'sector'],
        createProperties: ['numero_barra', 'sector'],
        sort: { sortBy: 'numero_barra', direction: 'asc' },
        properties: {
          numero_barra: { isRequired: true },
          sector:       { isRequired: true },
        },
        actions: { delete: deleteAction },
      },
    },
    {
      resource: BebidaModel,
      options: {
        id: 'Bebida',
        titleProperty: 'nombre',
        navigation: { name: 'Maestros', icon: 'Droplet' },
        listProperties:   ['id', 'nombre', 'precio'],
        showProperties:   ['id', 'nombre', 'precio', 'descripcion'],
        editProperties:   ['nombre', 'precio', 'descripcion'],
        createProperties: ['nombre', 'precio', 'descripcion'],
        sort: { sortBy: 'nombre', direction: 'asc' },
        searchableProperties: ['nombre'],
        properties: {
          nombre: { isRequired: true },
          precio: { isRequired: true },
        },
        actions: { delete: deleteAction },
      },
    },

    // ── Ventas ─────────────────────────────────────────────────────────────────
    {
      resource: VentaModel,
      options: {
        id: 'Venta',
        titleProperty: 'numero_venta',
        navigation: { name: 'Ventas', icon: 'ShoppingCart' },
        listProperties:   ['id', 'numero_venta', 'fecha', 'hora', 'total'],
        showProperties:   ['id', 'numero_venta', 'fecha', 'hora', 'total'],
        editProperties:   ['numero_venta', 'fecha', 'hora', 'total'],
        createProperties: ['numero_venta', 'fecha', 'hora', 'total'],
        sort: { sortBy: 'fecha', direction: 'desc' },
        filterProperties: ['fecha', 'numero_venta'],
        properties: {
          numero_venta: { isRequired: true },
          fecha:        { isRequired: true },
          hora:         { isRequired: true },
          total:        { isRequired: true },
        },
        actions: { delete: deleteAction },
      },
    },
    {
      resource: DetalleVentaModel,
      options: {
        id: 'DetalleVenta',
        navigation: { name: 'Ventas', icon: 'List' },
        listProperties:   ['id', 'venta_id', 'bebida_id', 'barra_id', 'cantidad', 'subtotal'],
        showProperties:   ['id', 'venta_id', 'bebida_id', 'barra_id', 'cantidad', 'subtotal'],
        editProperties:   ['venta_id', 'bebida_id', 'barra_id', 'cantidad', 'subtotal'],
        createProperties: ['venta_id', 'bebida_id', 'barra_id', 'cantidad', 'subtotal'],
        properties: {
          venta_id:  { isRequired: true },
          bebida_id: { isRequired: true },
          barra_id:  { isRequired: true },
          cantidad:  { isRequired: true },
          subtotal:  { isRequired: true },
        },
        actions: { delete: deleteAction },
      },
    },
  ],
  branding: {
    companyName: 'Bar',
    logo: false,
    favicon: '',
    withMadeWithLove: false,
    theme: {
      colors: {
        bg: '#080808',
        container: '#101010',
        sidebar: '#101010',
        filterBg: '#101010',
        border: 'rgba(255,255,255,0.07)',
        inputBorder: 'rgba(255,255,255,0.07)',
        separator: 'rgba(255,255,255,0.07)',
        text: '#ebebeb',
        grey100: '#ebebeb',
        grey80: '#ebebeb',
        grey60: '#888888',
        grey40: '#555555',
        grey20: '#161616',
        primary100: '#a259ff',
        primary80: '#b470ff',
        primary60: '#c48dff',
        primary40: '#d4aaff',
        primary20: '#ead9ff',
        accent: '#a259ff',
        white: '#080808',
        black: '#080808',
        love: '#a259ff',
        error: '#f56565',
        errorLight: 'rgba(245,101,101,0.12)',
      },
      borderRadius: '10px',
      font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
  },
  assets: {
    styles: [
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
      '/css/admin-custom.css',
    ],
  },
  locale: {
    language: 'en',
    translations: {
      en: {
        actions: {
          new:    'Nuevo',
          edit:   'Editar',
          show:   'Ver',
          delete: 'Eliminar',
          list:   'Listado',
          search: 'Buscar',
          bulkDelete: 'Eliminar seleccionados',
        },
        buttons: {
          save:                  'Guardar',
          addNewItem:            'Agregar elemento',
          filter:                'Filtrar',
          applyChanges:          'Aplicar',
          resetFilter:           'Limpiar',
          confirmRemovalMany:    'Eliminar {{count}} registro(s)',
          logout:                'Salir',
          login:                 'Entrar',
          seeAllRecords:         'Ver todos',
          createFirstRecord:     'Crear primer registro',
        },
        labels: {
          navigation:    'Navegación',
          pages:         'Páginas',
          selectedRecords: '{{count}} seleccionado(s)',
          filters:       'Filtros',
          adminVersion:  'Admin v{{version}}',
          appVersion:    'App v{{version}}',
        },
        messages: {
          loginWelcome:             'Bar — Administración',
          thereWereValidationErrors:'Completá los campos obligatorios antes de guardar.',
          successfullyBulkDeleted_one:  '{{count}} registro eliminado.',
          successfullyBulkDeleted_other:'{{count}} registros eliminados.',
          successfullyDeleted:      'Registro eliminado correctamente.',
          successfullyUpdated:      'Registro actualizado correctamente.',
          successfullyCreated:      'Registro creado correctamente.',
          thereWasAnError:          'Ocurrió un error.',
          noRecords:                'Sin registros.',
          seeAllRecords:            'Ver todos',
          confirmDelete:            '¿Estás seguro que querés eliminarlo?',
          welcomeOnBoard_title:     'Panel de administración',
          welcomeOnBoard_subtitle:  'Bar — de la barra a la caja.',
        },
        loginProperties: {
          email:    'Correo electrónico',
          password: 'Contraseña',
          submit:   'Entrar',
        },
        properties: {
          id:          'ID',
          createdAt:   'Creado',
          updatedAt:   'Actualizado',
        },
        resources: {
          Barra: {
            name: 'Barra',
            properties: {
              id:           'ID',
              numero_barra: 'N° de barra',
              sector:       'Sector',
            },
            actions: {
              list:   'Barras',
              new:    'Nueva barra',
              edit:   'Editar barra',
              show:   'Ver barra',
              delete: 'Eliminar barra',
            },
          },
          Bebida: {
            name: 'Bebida',
            properties: {
              id:          'ID',
              nombre:      'Nombre',
              precio:      'Precio',
              descripcion: 'Descripción',
            },
            actions: {
              list:   'Bebidas',
              new:    'Nueva bebida',
              edit:   'Editar bebida',
              show:   'Ver bebida',
              delete: 'Eliminar bebida',
            },
          },
          Venta: {
            name: 'Venta',
            properties: {
              id:           'ID',
              numero_venta: 'N° de venta',
              fecha:        'Fecha',
              hora:         'Hora',
              total:        'Total ($)',
            },
            actions: {
              list:   'Ventas',
              new:    'Nueva venta',
              edit:   'Editar venta',
              show:   'Ver venta',
              delete: 'Eliminar venta',
            },
          },
          DetalleVenta: {
            name: 'Detalle de venta',
            properties: {
              id:        'ID',
              venta_id:  'Venta',
              bebida_id: 'Bebida',
              barra_id:  'Barra',
              cantidad:  'Cantidad',
              subtotal:  'Subtotal ($)',
            },
            actions: {
              list:   'Detalles',
              new:    'Nuevo detalle',
              edit:   'Editar detalle',
              show:   'Ver detalle',
              delete: 'Eliminar detalle',
            },
          },
        },
        navigation: {
          Maestros: 'Maestros',
          Ventas:   'Ventas',
        },
      },
    },
  },
};
export { componentLoader };
