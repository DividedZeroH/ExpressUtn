// setup-project.js
import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\x1b[36m%s\x1b[0m', '=== AUTOMATED BOOTSTRAP AND DOCKER SETUP ===\n');

// 1. Define files to be written
const files = {
  '.dockerignore': `node_modules
npm-debug.log
.git
`,

  '.sequelizerc': `const path = require('path');

module.exports = {
  'config': path.resolve('src/config', 'database.cjs'),
  'models-path': path.resolve('src', 'models'),
  'seeders-path': path.resolve('src', 'seeders'),
  'migrations-path': path.resolve('src', 'migrations'),
};
`,

  'Dockerfile': `# Etapa base
FROM node:22-alpine AS base
LABEL maintainer="Desarrollador <soporte@ejemplo.com>"
LABEL version="1.0"
LABEL description="fabrica de piezas y herramientas"
RUN apk --no-cache add bash curl

# Etapa de construcción
FROM base AS builder
WORKDIR /build
COPY package*.json ./
RUN npm ci --omit=dev

# Etapa de producción
FROM base
RUN mkdir /code
WORKDIR /code
COPY package*.json ./
COPY --from=builder /build/node_modules ./node_modules
RUN ln -s /usr/share/zoneinfo/America/Cordoba /etc/localtime

CMD ["node", "src/app.js"]
`,

  'docker-compose.yml': `services:
  db:
    image: postgres:alpine
    env_file:
      - .env.db
    ports:
      - "5432:5432"
    healthcheck:
      test: [ "CMD-SHELL", "pg_isready" ]
      interval: 10s
      timeout: 2s
      retries: 5
    volumes:
      - postgres-db:/var/lib/postgresql
    networks:
      - net

  backend:
    build: .
    command: node src/app.js
    env_file:
      - .env.db
    ports:
      - "3000:3000"
    volumes:
      - ./src:/code/src
    depends_on:
      db:
        condition: service_healthy
    networks:
      - net

  generate:
    build: .
    user: root
    command: >
      /bin/sh -c '
        mkdir -p src/config src/models src/migrations src/seeders src/routes src/admin &&
        echo "Estructura del proyecto generada exitosamente en ./src/"
      '
    env_file:
      - .env.db
    volumes:
      - .:/code
    networks:
      - net

  manage:
    build: .
    entrypoint: npx sequelize-cli
    env_file:
      - .env.db
    volumes:
      - ./src:/code/src
      - ./.sequelizerc:/code/.sequelizerc
    depends_on:
      db:
        condition: service_healthy
    networks:
      - net

networks:
  net:

volumes:
  postgres-db:
`,

  'package.json': `{
  "name": "fabrica",
  "version": "1.0.0",
  "description": "Fabrica de piezas y herramientas",
  "type": "module",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js"
  },
  "dependencies": {
    "adminjs": "^7.8.13",
    "@adminjs/express": "^6.1.0",
    "@adminjs/sequelize": "^4.1.1",
    "connect-session-sequelize": "^7.1.7",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-formidable": "^1.2.0",
    "express-session": "^1.17.3",
    "pg": "^8.11.3",
    "pg-hstore": "^2.3.4",
    "sequelize": "^6.35.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "styled-components": "^5.3.6",
    "@adminjs/design-system": "^3.0.0"
  },
  "devDependencies": {
    "sequelize-cli": "^6.6.2"
  }
}`,

  'src/admin/components/custom-sidebar-branding.jsx': `import React from 'react'
import styled from 'styled-components'

const Brand = styled.a\`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px 20px 14px;
  text-decoration: none;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  margin-bottom: 4px;
  transition: opacity 150ms ease;

  &:hover { opacity: 0.8; }
\`

const Mark = styled.div\`
  width: 26px;
  height: 26px;
  background: #5b8af5;
  border-radius: 6px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
\`

const Name = styled.span\`
  color: #ebebeb;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.2px;
\`

const CustomSidebarBranding = () => (
  <Brand href="/admin">
    <Mark>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1" y="1" width="5" height="5" rx="1" fill="white" fillOpacity="0.9"/>
        <rect x="8" y="1" width="5" height="5" rx="1" fill="white" fillOpacity="0.5"/>
        <rect x="1" y="8" width="5" height="5" rx="1" fill="white" fillOpacity="0.5"/>
        <rect x="8" y="8" width="5" height="5" rx="1" fill="white" fillOpacity="0.3"/>
      </svg>
    </Mark>
    <Name>Fábrica</Name>
  </Brand>
)

export default CustomSidebarBranding
`,

  'src/admin/components/custom-sidebar-footer.jsx': `import React from 'react'

const CustomSidebarFooter = () => {
  return null
}

export default CustomSidebarFooter
`,

  'src/admin/components/custom-top-bar.jsx': `import React from 'react'
import styled from 'styled-components'
import { useSelector } from 'react-redux'

const Bar = styled.div\`
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 64px;
  z-index: 9999;
  background: rgba(8,8,8,0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255,255,255,0.07);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.25rem;
  box-sizing: border-box;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
\`

const Left = styled.div\`
  display: flex;
  align-items: center;
  gap: 4px;
\`

const Logo = styled.a\`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.2px;
  color: #ebebeb;
  text-decoration: none;
  margin-right: 24px;
  flex-shrink: 0;
  &:hover { opacity: 0.8; }
\`

const Mark = styled.div\`
  width: 26px;
  height: 26px;
  background: #5b8af5;
  border-radius: 6px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
\`

const NavLinks = styled.nav\`
  display: flex;
  align-items: center;
  gap: 2px;
  @media (max-width: 768px) { display: none; }
\`

const NavBtn = styled.button\`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  color: #888;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-weight: 450;
  letter-spacing: -0.1px;
  transition: color 150ms ease, background 150ms ease;
  &:hover { color: #ebebeb; background: #1e1e1e; }
\`

const Right = styled.div\`
  display: flex;
  align-items: center;
  gap: 8px;
\`

const BtnOutline = styled.a\`
  font-size: 13.5px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 6px;
  transition: all 150ms ease;
  white-space: nowrap;
  text-decoration: none;
  color: #888;
  border: 1px solid rgba(255,255,255,0.07);
  background: transparent;
  &:hover { color: #ebebeb; border-color: rgba(255,255,255,0.13); background: #1e1e1e; }
\`

const BtnSolid = styled.button\`
  font-size: 13.5px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 6px;
  transition: all 150ms ease;
  white-space: nowrap;
  color: #ebebeb;
  border: 1px solid rgba(255,255,255,0.13);
  background: transparent;
  &:hover { background: #1e1e1e; }
\`

const CustomTopBar = (props) => {
  const { toggleSidebar } = props
  const paths = useSelector((state) => state.paths)

  const go = (id) => { window.location.href = \`/admin/resources/\${id}\` }
  const logout = () => { window.location.href = paths?.logoutPath || '/admin/logout' }

  return (
    <Bar>
      <Left>
        <Logo href="/admin">
          <Mark>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="white" fillOpacity="0.9"/>
              <rect x="8" y="1" width="5" height="5" rx="1" fill="white" fillOpacity="0.5"/>
              <rect x="1" y="8" width="5" height="5" rx="1" fill="white" fillOpacity="0.5"/>
              <rect x="8" y="8" width="5" height="5" rx="1" fill="white" fillOpacity="0.3"/>
            </svg>
          </Mark>
          Fábrica
        </Logo>

        <NavLinks>
          <NavBtn onClick={() => go('UnidadMedida')}>Maestros</NavBtn>
          <NavBtn onClick={() => go('Pieza')}>Producción</NavBtn>
          <NavBtn onClick={() => go('Cliente')}>Clientes</NavBtn>
          <NavBtn onClick={() => go('Venta')}>Ventas</NavBtn>
        </NavLinks>
      </Left>

      <Right>
        <BtnOutline href="/">← Inicio</BtnOutline>
        <BtnSolid onClick={logout}>Salir</BtnSolid>
      </Right>
    </Bar>
  )
}

export default CustomTopBar
`,

  'src/admin/components/dashboard.jsx': `import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { ApiClient } from 'adminjs'

/* ── tokens (match index.html + admin-custom.css) ── */
const T = {
  bg:      '#080808',
  surface: '#101010',
  card:    '#161616',
  border:  'rgba(255,255,255,0.07)',
  borderH: 'rgba(255,255,255,0.13)',
  text:    '#ebebeb',
  muted:   '#888888',
  dim:     '#555555',
  accent:  '#5b8af5',
  green:   '#3ecf8e',
  red:     '#f56565',
  ease:    'cubic-bezier(0.16,1,0.3,1)',
}

/* ── layout ── */
const Page = styled.div\`
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: \${T.text};
  padding: 2.5rem 0;
\`

/* ── hero ── */
const HeroLabel = styled.p\`
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: \${T.accent};
  margin: 0 0 12px;
\`

const HeroTitle = styled.h1\`
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  margin: 0 0 10px;
  color: \${T.text};
\`

const HeroSub = styled.p\`
  font-size: 1rem;
  color: \${T.muted};
  line-height: 1.6;
  margin: 0 0 2.5rem;
  max-width: 580px;
\`

const Divider = styled.hr\`
  border: none;
  border-top: 1px solid \${T.border};
  margin: 0 0 2.5rem;
\`

/* ── stats grid ── */
const StatsGrid = styled.div\`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 3rem;
  @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 600px)  { grid-template-columns: 1fr; }
\`

const StatCard = styled.div\`
  background: \${T.card};
  border: 1px solid \${T.border};
  border-radius: 10px;
  padding: 1.4rem 1.5rem;
  transition: border-color 180ms \${T.ease}, transform 180ms \${T.ease};
  cursor: default;
  &:hover {
    border-color: \${T.borderH};
    transform: translateY(-1px);
  }
\`

const StatLabel = styled.span\`
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: \${T.dim};
  display: block;
  margin-bottom: 8px;
\`

const StatValue = styled.div\`
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: \${T.text};
  line-height: 1;
  margin-bottom: 6px;
\`

const StatDesc = styled.div\`
  font-size: 12.5px;
  color: \${T.muted};
\`

/* ── section heading ── */
const SectionTitle = styled.h2\`
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: -0.1px;
  color: \${T.muted};
  margin: 0 0 1.25rem;
\`

/* ── resource grid ── */
const ResourceGrid = styled.div\`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 600px)  { grid-template-columns: 1fr; }
\`

const ResourceCard = styled.div\`
  background: \${T.card};
  border: 1px solid \${T.border};
  border-radius: 10px;
  padding: 1.5rem;
  cursor: pointer;
  transition: border-color 180ms \${T.ease}, transform 180ms \${T.ease}, background 180ms \${T.ease};
  display: flex;
  flex-direction: column;
  gap: 12px;
  &:hover {
    border-color: \${T.borderH};
    background: #1a1a1a;
    transform: translateY(-2px);
  }
\`

const CardIcon = styled.div\`
  width: 36px;
  height: 36px;
  background: #1a1a1a;
  border: 1px solid \${T.border};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: \${T.muted};
  letter-spacing: -0.5px;
  flex-shrink: 0;
\`

const CardName = styled.div\`
  font-size: 14px;
  font-weight: 600;
  color: \${T.text};
  letter-spacing: -0.1px;
\`

const CardArrow = styled.div\`
  font-size: 13px;
  color: \${T.dim};
  margin-top: auto;
  transition: color 180ms \${T.ease};
  \${ResourceCard}:hover & { color: \${T.muted}; }
\`

/* ── component ── */
const Dashboard = () => {
  const [stats, setStats] = useState({ piezas: 0, componentes: 0, clientes: 0, ventas: 0, loading: true })

  useEffect(() => {
    const api = new ApiClient()
    Promise.all([
      api.resourceAction({ resourceId: 'Pieza',      actionName: 'list' }),
      api.resourceAction({ resourceId: 'Componente', actionName: 'list' }),
      api.resourceAction({ resourceId: 'Cliente',    actionName: 'list' }),
      api.resourceAction({ resourceId: 'Venta',      actionName: 'list' }),
    ]).then(([p, c, cl, v]) => {
      setStats({
        piezas:      p.data.meta.total  || 0,
        componentes: c.data.meta.total  || 0,
        clientes:    cl.data.meta.total || 0,
        ventas:      v.data.meta.total  || 0,
        loading: false,
      })
    }).catch(() => setStats(s => ({ ...s, loading: false })))
  }, [])

  const resources = [
    { id: 'UnidadMedida', name: 'Unidades de Medida', icon: 'UM' },
    { id: 'Componente',   name: 'Componentes',         icon: 'CO' },
    { id: 'Barrio',       name: 'Barrios',              icon: 'BA' },
    { id: 'Localidad',    name: 'Localidades',          icon: 'LO' },
    { id: 'Provincia',    name: 'Provincias',           icon: 'PR' },
    { id: 'Pieza',        name: 'Piezas',               icon: 'PI' },
    { id: 'Ensamblaje',   name: 'Ensamblajes',          icon: 'EN' },
    { id: 'Cliente',      name: 'Clientes',             icon: 'CL' },
    { id: 'Venta',        name: 'Ventas',               icon: 'VE' },
    { id: 'DetalleVenta', name: 'Detalle de Ventas',    icon: 'DV' },
  ]

  const go = (id) => { window.location.href = \`/admin/resources/\${id}\` }
  const n = (v) => stats.loading ? '—' : v

  return (
    <Page>
      <HeroLabel>Panel de control</HeroLabel>
      <HeroTitle>Panel de Administración</HeroTitle>
      <HeroSub>Gestiona los recursos, el inventario, la fabricación y los clientes de tu fábrica.</HeroSub>
      <Divider />

      <StatsGrid>
        <StatCard>
          <StatLabel>Piezas</StatLabel>
          <StatValue>{n(stats.piezas)}</StatValue>
          <StatDesc>Productos y herramientas</StatDesc>
        </StatCard>
        <StatCard>
          <StatLabel>Componentes</StatLabel>
          <StatValue>{n(stats.componentes)}</StatValue>
          <StatDesc>Materia prima</StatDesc>
        </StatCard>
        <StatCard>
          <StatLabel>Clientes</StatLabel>
          <StatValue>{n(stats.clientes)}</StatValue>
          <StatDesc>Cartera comercial</StatDesc>
        </StatCard>
        <StatCard>
          <StatLabel>Ventas</StatLabel>
          <StatValue>{n(stats.ventas)}</StatValue>
          <StatDesc>Transacciones registradas</StatDesc>
        </StatCard>
      </StatsGrid>

      <SectionTitle>Recursos del sistema</SectionTitle>
      <ResourceGrid>
        {resources.map((r) => (
          <ResourceCard key={r.id} onClick={() => go(r.id)}>
            <CardIcon>{r.icon}</CardIcon>
            <CardName>{r.name}</CardName>
            <CardArrow>Abrir →</CardArrow>
          </ResourceCard>
        ))}
      </ResourceGrid>
    </Page>
  )
}

export default Dashboard
`,

  'src/admin/index.js': `// src/admin/index.js
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ComponentLoader } from 'adminjs';
import {
  UnidadMedida,
  Componente,
  Barrio,
  Localidad,
  Provincia,
  Pieza,
  Cliente,
  Venta,
  DetalleVenta,
  Ensamblaje,
} from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const componentLoader = new ComponentLoader();

componentLoader.override('SidebarBranding', join(__dirname, 'components', 'custom-sidebar-branding.jsx'));
componentLoader.override('SidebarFooter',   join(__dirname, 'components', 'custom-sidebar-footer.jsx'));
componentLoader.override('TopBar',          join(__dirname, 'components', 'custom-top-bar.jsx'));

const Components = {
  Dashboard: componentLoader.add('Dashboard', join(__dirname, 'components', 'dashboard.jsx')),
};

// Handler de borrado que captura errores de FK y los muestra como toast legible
const safeDelete = async (request, response, context) => {
  const { record, resource, h, currentAdmin } = context;
  try {
    await record.delete(currentAdmin);
    return {
      record: record.toJSON(currentAdmin),
      redirectUrl: h.resourceUrl({ resourceId: resource.id() }),
      notice: { message: 'Registro eliminado correctamente.', type: 'success' },
    };
  } catch (err) {
    const isFk = err.original?.code === '23503' || err.message?.includes('foreign key');
    const msg = isFk
      ? 'No se puede eliminar: el registro está siendo usado por otros datos (clave foránea).'
      : \`Error al eliminar: \${err.message}\`;
    return {
      record: record.toJSON(currentAdmin),
      notice: { message: msg, type: 'error' },
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
      resource: UnidadMedida,
      options: {
        id: 'UnidadMedida',
        navigation: { name: 'Maestros', icon: 'Ruler' },
        listProperties:   ['id', 'nombre'],
        showProperties:   ['id', 'nombre'],
        editProperties:   ['nombre'],
        createProperties: ['nombre'],
        sort: { sortBy: 'nombre', direction: 'asc' },
        properties: {
          nombre: { isRequired: true },
        },
        actions: { delete: deleteAction },
      },
    },
    {
      resource: Componente,
      options: {
        id: 'Componente',
        navigation: { name: 'Maestros', icon: 'Cpu' },
        listProperties:   ['id', 'nombre', 'costo', 'unidad_medida_id'],
        showProperties:   ['id', 'nombre', 'costo', 'unidad_medida_id'],
        editProperties:   ['nombre', 'costo', 'unidad_medida_id'],
        createProperties: ['nombre', 'costo', 'unidad_medida_id'],
        sort: { sortBy: 'nombre', direction: 'asc' },
        searchableProperties: ['nombre'],
        properties: {
          nombre:           { isRequired: true },
          costo:            { isRequired: true },
          unidad_medida_id: { isRequired: true, reference: 'UnidadMedida' },
        },
        actions: { delete: deleteAction },
      },
    },

    // ── Geografía ──────────────────────────────────────────────────────────────
    {
      resource: Barrio,
      options: {
        id: 'Barrio',
        navigation: { name: 'Geografía', icon: 'Location' },
        listProperties:   ['id', 'nombre'],
        showProperties:   ['id', 'nombre'],
        editProperties:   ['nombre'],
        createProperties: ['nombre'],
        sort: { sortBy: 'nombre', direction: 'asc' },
        properties: {
          nombre: { isRequired: true },
        },
        actions: { delete: deleteAction },
      },
    },
    {
      resource: Localidad,
      options: {
        id: 'Localidad',
        navigation: { name: 'Geografía', icon: 'Location' },
        listProperties:   ['id', 'nombre'],
        showProperties:   ['id', 'nombre'],
        editProperties:   ['nombre'],
        createProperties: ['nombre'],
        sort: { sortBy: 'nombre', direction: 'asc' },
        properties: {
          nombre: { isRequired: true },
        },
        actions: { delete: deleteAction },
      },
    },
    {
      resource: Provincia,
      options: {
        id: 'Provincia',
        navigation: { name: 'Geografía', icon: 'Location' },
        listProperties:   ['id', 'nombre'],
        showProperties:   ['id', 'nombre'],
        editProperties:   ['nombre'],
        createProperties: ['nombre'],
        sort: { sortBy: 'nombre', direction: 'asc' },
        properties: {
          nombre: { isRequired: true },
        },
        actions: { delete: deleteAction },
      },
    },

    // ── Producción ─────────────────────────────────────────────────────────────
    {
      resource: Pieza,
      options: {
        id: 'Pieza',
        navigation: { name: 'Producción', icon: 'Tool' },
        listProperties:   ['id', 'nombre', 'ganancia', 'es_herramienta'],
        showProperties:   ['id', 'nombre', 'ganancia', 'es_herramienta'],
        editProperties:   ['nombre', 'ganancia', 'es_herramienta'],
        createProperties: ['nombre', 'ganancia', 'es_herramienta'],
        sort: { sortBy: 'nombre', direction: 'asc' },
        searchableProperties: ['nombre'],
        filterProperties:     ['nombre', 'es_herramienta'],
        properties: {
          nombre:   { isRequired: true },
          ganancia: { isRequired: true },
        },
        actions: {
          delete: deleteAction,
          duplicate: {
            actionType: 'record',
            icon: 'Copy',
            label: 'Duplicar',
            handler: async (request, response, context) => {
              const { record, resource, h } = context;
              const { id, ...data } = record.params;
              await resource.create({ ...data, nombre: \`\${data.nombre} (COPIA)\` });
              return {
                redirectUrl: h.resourceUrl({ resourceId: resource.id() }),
                notice: { message: 'Pieza duplicada con éxito', type: 'success' },
              };
            },
          },
        },
      },
    },
    {
      resource: Ensamblaje,
      options: {
        id: 'Ensamblaje',
        navigation: { name: 'Producción', icon: 'Settings' },
        listProperties:   ['id', 'pieza_id', 'componente_id', 'cantidad'],
        showProperties:   ['id', 'pieza_id', 'componente_id', 'cantidad'],
        editProperties:   ['pieza_id', 'componente_id', 'cantidad'],
        createProperties: ['pieza_id', 'componente_id', 'cantidad'],
        sort: { sortBy: 'componente_id', direction: 'asc' },
        properties: {
          cantidad:      { isRequired: true },
          pieza_id:      { isRequired: true, reference: 'Pieza' },
          componente_id: { isRequired: true, reference: 'Componente' },
        },
        actions: { delete: deleteAction },
      },
    },

    // ── Clientes ───────────────────────────────────────────────────────────────
    {
      resource: Cliente,
      options: {
        id: 'Cliente',
        navigation: { name: 'Clientes', icon: 'User' },
        listProperties:   ['id', 'nombre', 'numero_documento', 'email', 'celular'],
        showProperties:   ['id', 'nombre', 'numero_documento', 'direccion', 'celular', 'telefono', 'email', 'barrio_id', 'localidad_id', 'provincia_id'],
        editProperties:   ['nombre', 'numero_documento', 'direccion', 'celular', 'telefono', 'email', 'barrio_id', 'localidad_id', 'provincia_id'],
        createProperties: ['nombre', 'numero_documento', 'direccion', 'celular', 'telefono', 'email', 'barrio_id', 'localidad_id', 'provincia_id'],
        sort: { sortBy: 'nombre', direction: 'asc' },
        searchableProperties: ['nombre', 'email'],
        filterProperties:     ['localidad_id', 'provincia_id'],
        properties: {
          nombre:       { isRequired: true },
          barrio_id:    { reference: 'Barrio' },
          localidad_id: { reference: 'Localidad' },
          provincia_id: { reference: 'Provincia' },
        },
        actions: { delete: deleteAction },
      },
    },

    // ── Ventas ─────────────────────────────────────────────────────────────────
    {
      resource: Venta,
      options: {
        id: 'Venta',
        navigation: { name: 'Ventas', icon: 'ShoppingCart' },
        listProperties:   ['id', 'fecha', 'cliente_id'],
        showProperties:   ['id', 'fecha', 'cliente_id'],
        editProperties:   ['fecha', 'cliente_id'],
        createProperties: ['fecha', 'cliente_id'],
        sort: { sortBy: 'fecha', direction: 'asc' },
        filterProperties: ['fecha', 'cliente_id'],
        properties: {
          fecha:      { isRequired: true },
          cliente_id: { isRequired: true, reference: 'Cliente' },
        },
        actions: {
          delete: deleteAction,
          generateReceipt: {
            actionType: 'record',
            icon: 'FileText',
            label: 'Generar Recibo',
            handler: async (request, response, context) => {
              return {
                notice: { message: 'Recibo generado correctamente (simulado)', type: 'success' },
              };
            },
          },
        },
      },
    },
    {
      resource: DetalleVenta,
      options: {
        id: 'DetalleVenta',
        navigation: { name: 'Ventas', icon: 'List' },
        listProperties:   ['id', 'venta_id', 'pieza_id', 'cantidad'],
        showProperties:   ['id', 'venta_id', 'pieza_id', 'cantidad'],
        editProperties:   ['venta_id', 'pieza_id', 'cantidad'],
        createProperties: ['venta_id', 'pieza_id', 'cantidad'],
        properties: {
          venta_id: { isRequired: true, reference: 'Venta' },
          pieza_id: { isRequired: true, reference: 'Pieza' },
        },
        actions: { delete: deleteAction },
      },
    },
  ],
  branding: {
    companyName: 'Fábrica',
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
        primary100: '#5b8af5',
        primary80: '#7a9ff7',
        primary60: '#93b3f9',
        primary40: '#b8ccfb',
        primary20: '#dce8fd',
        accent: '#5b8af5',
        white: '#080808',
        black: '#080808',
        love: '#5b8af5',
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
    language: 'es',
    translations: {
      es: {
        actions: {
          new: 'Crear',
          edit: 'Editar',
          show: 'Ver',
          delete: 'Eliminar',
          list: 'Listar',
          duplicate: 'Duplicar',
          generateReceipt: 'Generar Recibo',
        },
        buttons: {
          save: 'Guardar',
          addNewItem: 'Agregar',
          filter: 'Filtrar',
          applyChanges: 'Aplicar',
          resetFilter: 'Resetear',
          confirmRemovalMany: 'Confirmar eliminación de {{count}} registro(s)',
          logout: 'Cerrar sesión',
        },
        messages: {
          thereWereValidationErrors: 'Completá los campos obligatorios antes de guardar.',
        },
      },
    },
  },
};
export { componentLoader };
`,

  'src/app.js': `// src/app.js
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

    app.get('/', (req, res) => {
      res.sendFile(join(__dirname, 'public', 'index.html'));
    });

    await sequelize.authenticate();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(\`Servidor corriendo en http://localhost:\${PORT}\`);
      console.log(\`Panel de administración en http://localhost:\${PORT}/admin\`);
    });
  } catch (err) {
    console.error('Error durante el inicio del servidor:', err.message);
    console.error(err);
    process.exit(1);
  }
};

start();
`,

  'src/config/database.cjs': `// src/config/database.cjs
require('dotenv').config();

const config = {
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  dialect: 'postgres',
  logging: false,
};

module.exports = {
  development: config,
  production: config,
};
`,

  'src/migrations/001-initial.js': `// src/migrations/001-initial.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('unidades_medida', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING(200), allowNull: false },
    });

    await queryInterface.createTable('componentes', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING(200), allowNull: false },
      costo: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      unidad_medida_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'unidades_medida', key: 'id' },
        onDelete: 'RESTRICT',
      },
    });

    await queryInterface.createTable('barrios', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING(200), allowNull: false },
    });

    await queryInterface.createTable('localidades', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING(200), allowNull: false },
    });

    await queryInterface.createTable('provincias', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING(200), allowNull: false },
    });

    await queryInterface.createTable('piezas', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING(200), allowNull: false },
      ganancia: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      es_herramienta: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    });

    await queryInterface.createTable('ensamblajes', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      cantidad: { type: Sequelize.DECIMAL(15, 3), allowNull: false, defaultValue: 0 },
      componente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'componentes', key: 'id' },
        onDelete: 'RESTRICT',
      },
      pieza_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'piezas', key: 'id' },
        onDelete: 'RESTRICT',
      },
    });

    await queryInterface.createTable('clientes', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING(200), allowNull: false },
      numero_documento: { type: Sequelize.BIGINT, allowNull: true },
      direccion: { type: Sequelize.STRING(200), allowNull: true },
      celular: { type: Sequelize.BIGINT, allowNull: true },
      telefono: { type: Sequelize.BIGINT, allowNull: true },
      email: { type: Sequelize.STRING, allowNull: true },
      barrio_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'barrios', key: 'id' },
        onDelete: 'SET NULL',
      },
      localidad_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'localidades', key: 'id' },
        onDelete: 'CASCADE',
      },
      provincia_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'provincias', key: 'id' },
        onDelete: 'RESTRICT',
      },
    });

    await queryInterface.addIndex('clientes', ['numero_documento'], {
      name: 'clientes_documento_unico',
    });

    await queryInterface.createTable('ventas', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      fecha: { type: Sequelize.DATEONLY, allowNull: false },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clientes', key: 'id' },
        onDelete: 'RESTRICT',
      },
    });

    await queryInterface.createTable('detalle_ventas', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      venta_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ventas', key: 'id' },
        onDelete: 'RESTRICT',
      },
      cantidad: { type: Sequelize.DECIMAL(15, 2), allowNull: true, defaultValue: null },
      pieza_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'piezas', key: 'id' },
        onDelete: 'RESTRICT',
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('detalle_ventas');
    await queryInterface.dropTable('ventas');
    await queryInterface.dropTable('clientes');
    await queryInterface.dropTable('ensamblajes');
    await queryInterface.dropTable('piezas');
    await queryInterface.dropTable('provincias');
    await queryInterface.dropTable('localidades');
    await queryInterface.dropTable('barrios');
    await queryInterface.dropTable('componentes');
    await queryInterface.dropTable('unidades_medida');
  },
};
`,

  'src/migrations/002-sessions.js': `// src/migrations/002-sessions.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Sessions', {
      sid: {
        type: Sequelize.STRING(36),
        primaryKey: true,
      },
      expires: {
        type: Sequelize.DATE,
      },
      data: {
        type: Sequelize.TEXT,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Sessions');
  },
};
`,

  'src/migrations/package.json': `{ "type": "commonjs" }
`,

  'src/models/barrio.js': `// src/models/barrio.js
'use strict';
export default (sequelize, DataTypes) => {
  const Barrio = sequelize.define('Barrio', {
    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
  }, {
    tableName: 'barrios',
    timestamps: false,
    hooks: {
      beforeSave: (instance) => {
        if (instance.nombre) instance.nombre = instance.nombre.toUpperCase();
      },
    },
  });
  return Barrio;
};
`,

  'src/models/cliente.js': `// src/models/cliente.js
'use strict';
export default (sequelize, DataTypes) => {
  const Cliente = sequelize.define('Cliente', {
    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    numero_documento: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'Número de documento / CUIT',
    },
    direccion: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    celular: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    telefono: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isEmail: true },
    },
    barrio_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    localidad_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    provincia_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'clientes',
    timestamps: false,
    indexes: [
      {
        name: 'clientes_documento_unico',
        fields: ['numero_documento'],
      },
    ],
    hooks: {
      beforeSave: (instance) => {
        if (instance.nombre) instance.nombre = instance.nombre.toUpperCase();
      },
    },
  });
  return Cliente;
};
`,

  'src/models/componente.js': `// src/models/componente.js
'use strict';
export default (sequelize, DataTypes) => {
  const Componente = sequelize.define('Componente', {
    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    costo: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Costo del componente expresado en pesos',
    },
    unidad_medida_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'componentes',
    timestamps: false,
    hooks: {
      beforeSave: (instance) => {
        if (instance.nombre) instance.nombre = instance.nombre.toUpperCase();
      },
    },
  });
  return Componente;
};
`,

  'src/models/detalleventa.js': `// src/models/detalleventa.js
'use strict';
export default (sequelize, DataTypes) => {
  const DetalleVenta = sequelize.define('DetalleVenta', {
    venta_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: null,
    },
    pieza_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'detalle_ventas',
    timestamps: false,
  });
  return DetalleVenta;
};
`,

  'src/models/ensamblaje.js': `// src/models/ensamblaje.js
'use strict';
export default (sequelize, DataTypes) => {
  const Ensamblaje = sequelize.define('Ensamblaje', {
    cantidad: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
      defaultValue: 0,
      comment: 'Cantidad del componente en su unidad de medida',
    },
    componente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pieza_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'ensamblajes',
    timestamps: false,
  });
  return Ensamblaje;
};
`,

  'src/models/index.js': `// src/models/index.js
import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import dbConfig from '../config/database.cjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

import UnidadMedidaModel from './unidadmedida.js';
import ComponenteModel from './componente.js';
import BarrioModel from './barrio.js';
import LocalidadModel from './localidad.js';
import ProvinciaModel from './provincia.js';
import PiezaModel from './pieza.js';
import ClienteModel from './cliente.js';
import VentaModel from './venta.js';
import DetalleVentaModel from './detalleventa.js';
import EnsamblajeModel from './ensamblaje.js';

const UnidadMedida = UnidadMedidaModel(sequelize, DataTypes);
const Componente = ComponenteModel(sequelize, DataTypes);
const Barrio = BarrioModel(sequelize, DataTypes);
const Localidad = LocalidadModel(sequelize, DataTypes);
const Provincia = ProvinciaModel(sequelize, DataTypes);
const Pieza = PiezaModel(sequelize, DataTypes);
const Cliente = ClienteModel(sequelize, DataTypes);
const Venta = VentaModel(sequelize, DataTypes);
const DetalleVenta = DetalleVentaModel(sequelize, DataTypes);
const Ensamblaje = EnsamblajeModel(sequelize, DataTypes);

Componente.belongsTo(UnidadMedida, { foreignKey: 'unidad_medida_id', as: 'UnidadMedida' });
UnidadMedida.hasMany(Componente, { foreignKey: 'unidad_medida_id', as: 'Componentes' });

Ensamblaje.belongsTo(Componente, { foreignKey: 'componente_id', as: 'Componente' });
Ensamblaje.belongsTo(Pieza, { foreignKey: 'pieza_id', as: 'Pieza' });
Componente.hasMany(Ensamblaje, { foreignKey: 'componente_id', as: 'Ensamblajes' });
Pieza.hasMany(Ensamblaje, { foreignKey: 'pieza_id', as: 'Ensamblajes' });

Cliente.belongsTo(Barrio, { foreignKey: 'barrio_id', as: 'Barrio' });
Cliente.belongsTo(Localidad, { foreignKey: 'localidad_id', as: 'Localidad' });
Cliente.belongsTo(Provincia, { foreignKey: 'provincia_id', as: 'Provincia' });
Barrio.hasMany(Cliente, { foreignKey: 'barrio_id' });
Localidad.hasMany(Cliente, { foreignKey: 'localidad_id' });
Provincia.hasMany(Cliente, { foreignKey: 'provincia_id' });

Venta.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'Cliente' });
Cliente.hasMany(Venta, { foreignKey: 'cliente_id', as: 'Compras' });

DetalleVenta.belongsTo(Venta, { foreignKey: 'venta_id', as: 'Venta' });
DetalleVenta.belongsTo(Pieza, { foreignKey: 'pieza_id', as: 'Pieza' });
Venta.hasMany(DetalleVenta, { foreignKey: 'venta_id', as: 'Detalle' });
Pieza.hasMany(DetalleVenta, { foreignKey: 'pieza_id', as: 'Detalle' });

export {
  sequelize,
  Sequelize,
  UnidadMedida,
  Componente,
  Barrio,
  Localidad,
  Provincia,
  Pieza,
  Cliente,
  Venta,
  DetalleVenta,
  Ensamblaje,
};
`,

  'src/models/localidad.js': `// src/models/localidad.js
'use strict';
export default (sequelize, DataTypes) => {
  const Localidad = sequelize.define('Localidad', {
    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
  }, {
    tableName: 'localidades',
    timestamps: false,
    hooks: {
      beforeSave: (instance) => {
        if (instance.nombre) instance.nombre = instance.nombre.toUpperCase();
      },
    },
  });
  return Localidad;
};
`,

  'src/models/pieza.js': `// src/models/pieza.js
'use strict';
export default (sequelize, DataTypes) => {
  const Pieza = sequelize.define('Pieza', {
    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    ganancia: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Ganancia expresada en coeficiente',
    },
    es_herramienta: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Especifica si la pieza se clasifica como herramienta',
    },
    precio: {
      type: DataTypes.VIRTUAL,
      get() {
        const ensamblajes = this.Ensamblajes;
        if (!ensamblajes || ensamblajes.length === 0) return 0;
        const total = ensamblajes.reduce((sum, ens) => {
          const costo = ens.Componente ? parseFloat(ens.Componente.costo) : 0;
          return sum + parseFloat(ens.cantidad) * costo;
        }, 0);
        return Math.round(total * parseFloat(this.ganancia) * 100) / 100;
      },
    },
  }, {
    tableName: 'piezas',
    timestamps: false,
    hooks: {
      beforeSave: (instance) => {
        if (instance.nombre) instance.nombre = instance.nombre.toUpperCase();
      },
    },
  });
  return Pieza;
};
`,

  'src/models/provincia.js': `// src/models/provincia.js
'use strict';
export default (sequelize, DataTypes) => {
  const Provincia = sequelize.define('Provincia', {
    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
  }, {
    tableName: 'provincias',
    timestamps: false,
    hooks: {
      beforeSave: (instance) => {
        if (instance.nombre) instance.nombre = instance.nombre.toUpperCase();
      },
    },
  });
  return Provincia;
};
`,

  'src/models/unidadmedida.js': `// src/models/unidadmedida.js
'use strict';
export default (sequelize, DataTypes) => {
  const UnidadMedida = sequelize.define('UnidadMedida', {
    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
  }, {
    tableName: 'unidades_medida',
    timestamps: false,
    hooks: {
      beforeSave: (instance) => {
        if (instance.nombre) instance.nombre = instance.nombre.toUpperCase();
      },
    },
  });
  return UnidadMedida;
};
`,

  'src/models/venta.js': `// src/models/venta.js
'use strict';
export default (sequelize, DataTypes) => {
  const Venta = sequelize.define('Venta', {
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Fecha de la venta',
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'ventas',
    timestamps: false,
  });
  return Venta;
};
`,

  'src/public/css/admin-custom.css': `/* ═══════════════════════════════════════════════════════════════════════════
   FÁBRICA ADMIN — Design tokens matching localhost:3000/
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Tokens ──────────────────────────────────────────────────────────────── */
:root {
  --adm-bg:       #080808;
  --adm-surface:  #101010;
  --adm-card:     #161616;
  --adm-elevated: #1e1e1e;
  --adm-hover:    #242424;

  --adm-border:       rgba(255,255,255,0.07);
  --adm-border-h:     rgba(255,255,255,0.13);
  --adm-border-focus: rgba(91,138,245,0.45);

  --adm-text:   #ebebeb;
  --adm-muted:  #888888;
  --adm-dim:    #555555;

  --adm-accent: #5b8af5;
  --adm-adim:   rgba(91,138,245,0.12);

  --adm-green:  #3ecf8e;
  --adm-amber:  #f5a623;
  --adm-red:    #f56565;

  --adm-r-sm:  6px;
  --adm-r-md:  10px;
  --adm-r-lg:  14px;
  --adm-r-xl:  20px;

  --adm-shadow-sm: 0 2px 8px rgba(0,0,0,0.55);
  --adm-shadow-md: 0 4px 20px rgba(0,0,0,0.65);
  --adm-shadow-lg: 0 12px 40px rgba(0,0,0,0.75);

  --adm-ease: cubic-bezier(0.16,1,0.3,1);
  --adm-fast: 150ms;
}

/* ── Font (Google Fonts loaded via assets.styles in admin/index.js) ───────── */
html, body, #adminjs, #app {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
  background: var(--adm-bg) !important;
  color: var(--adm-text) !important;
  -webkit-font-smoothing: antialiased !important;
}

/* ── Scrollbar ───────────────────────────────────────────────────────────── */
::-webkit-scrollbar       { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }
::selection { background: var(--adm-adim); color: var(--adm-text); }

/* ── Headings ────────────────────────────────────────────────────────────── */
h1, h2, h3, h4, h5, h6,
[data-css="h1"], [data-css="h2"], [data-css="h3"], [data-css="h4"],
.adminjs_H1, .adminjs_H2, .adminjs_H3, .adminjs_H4 {
  font-family: 'Inter', sans-serif !important;
  color: var(--adm-text) !important;
  letter-spacing: -0.3px !important;
}

/* muted text */
[data-css="breadcrumbs"] span,
[data-css="breadcrumbs"] a,
[data-css="caption"],
.adminjs_Text[color="grey60"],
.adminjs_Text[color="grey40"] {
  color: var(--adm-muted) !important;
  font-size: 13px !important;
}
[data-css="breadcrumbs"] a:hover { color: var(--adm-accent) !important; }

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
[data-css="sidebar"],
.adminjs_Sidebar {
  background: var(--adm-surface) !important;
  border-right: 1px solid var(--adm-border) !important;
  box-shadow: none !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 280px !important;
  height: 100vh !important;
  padding-top: 64px !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  z-index: 100 !important;
  box-sizing: border-box !important;
}

[data-css="sidebar-resources"],
.adminjs_SidebarResources {
  background: transparent !important;
}

/* sidebar section header */
[data-css="sidebar"] [data-css="caption"],
[data-css="nav-group-label"] {
  color: var(--adm-dim) !important;
  font-size: 10.5px !important;
  font-weight: 500 !important;
  letter-spacing: 0.8px !important;
  text-transform: uppercase !important;
  padding: 14px 20px 4px !important;
  display: block !important;
}

/* sidebar nav links */
[data-css="sidebar"] a,
[data-css="sidebar-resources"] a,
[data-css="sidebar"] button {
  color: var(--adm-muted) !important;
  font-size: 13.5px !important;
  font-weight: 450 !important;
  padding: 7px 14px !important;
  margin: 1px 10px !important;
  border-radius: var(--adm-r-sm) !important;
  transition: color var(--adm-fast) var(--adm-ease),
              background var(--adm-fast) var(--adm-ease) !important;
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  text-decoration: none !important;
  background: transparent !important;
  border: none !important;
}

[data-css="sidebar"] a:hover,
[data-css="sidebar-resources"] a:hover,
[data-css="sidebar"] button:hover {
  color: var(--adm-text) !important;
  background: var(--adm-elevated) !important;
}

[data-css="sidebar"] a[aria-current="page"],
[data-css="sidebar-resources"] a.active {
  color: var(--adm-text) !important;
  background: var(--adm-elevated) !important;
  font-weight: 500 !important;
}

/* ── TopBar ──────────────────────────────────────────────────────────────── */
[data-css="top-bar"],
[data-css="topbar"],
.adminjs_TopBar {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 64px !important;
  z-index: 200 !important;
  background: rgba(8,8,8,0.90) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  border-bottom: 1px solid var(--adm-border) !important;
  box-shadow: none !important;
  display: flex !important;
  align-items: center !important;
}

/* ── App Content ─────────────────────────────────────────────────────────── */
[data-css="app-content"] {
  margin-top: 64px !important;
  margin-left: 280px !important;
  background: var(--adm-bg) !important;
  min-height: calc(100vh - 64px) !important;
  padding: 28px 32px !important;
  box-sizing: border-box !important;
}

/* ── Page wrapper — color only on explicitly styled elements ─────────────── */
[data-css="section"] {
  background: transparent !important;
  border-color: var(--adm-border) !important;
}

/* ── Table wrapper ───────────────────────────────────────────────────────── */
[data-css="table-wrapper"],
[data-css="records-table-wrapper"],
.adminjs_TableWrapper {
  background: var(--adm-card) !important;
  border: 1px solid var(--adm-border) !important;
  border-radius: var(--adm-r-lg) !important;
  overflow: hidden !important;
}

/* ── Table ───────────────────────────────────────────────────────────────── */
table {
  width: 100% !important;
  border-collapse: collapse !important;
  background: transparent !important;
}

thead tr {
  background: var(--adm-surface) !important;
  border-bottom: 1px solid var(--adm-border) !important;
}

thead th {
  color: var(--adm-dim) !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  letter-spacing: 0.7px !important;
  text-transform: uppercase !important;
  padding: 11px 16px !important;
  border: none !important;
  background: transparent !important;
  white-space: nowrap !important;
  font-family: 'Inter', sans-serif !important;
}

tbody tr {
  border-bottom: 1px solid var(--adm-border) !important;
  transition: background var(--adm-fast) var(--adm-ease) !important;
}
tbody tr:last-child { border-bottom: none !important; }
tbody tr:hover      { background: var(--adm-elevated) !important; }

tbody td {
  color: var(--adm-text) !important;
  font-size: 13.5px !important;
  padding: 11px 16px !important;
  border: none !important;
  background: transparent !important;
  font-family: 'Inter', sans-serif !important;
}

/* ── Form labels ─────────────────────────────────────────────────────────── */
label,
[data-css="label"],
[data-css="input-label"] {
  color: var(--adm-muted) !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  margin-bottom: 5px !important;
  display: block !important;
  font-family: 'Inter', sans-serif !important;
}

/* ── Inputs / Textarea / Select ──────────────────────────────────────────── */
input[type="text"],
input[type="email"],
input[type="number"],
input[type="password"],
input[type="search"],
input[type="date"],
input[type="tel"],
input[type="url"],
select,
textarea {
  background: var(--adm-surface) !important;
  border: 1px solid var(--adm-border) !important;
  border-radius: var(--adm-r-sm) !important;
  color: var(--adm-text) !important;
  font-size: 14px !important;
  font-family: 'Inter', sans-serif !important;
  outline: none !important;
  transition: border-color var(--adm-fast),
              box-shadow var(--adm-fast) !important;
}

input:hover, select:hover, textarea:hover {
  border-color: var(--adm-border-h) !important;
}
input:focus, select:focus, textarea:focus {
  border-color: var(--adm-accent) !important;
  box-shadow: 0 0 0 3px var(--adm-border-focus) !important;
}
input::placeholder, textarea::placeholder { color: var(--adm-dim) !important; }

/* ── Buttons ─────────────────────────────────────────────────────────────── */
[data-css="button"][data-variant="primary"],
[data-variant="primary"],
button[type="submit"] {
  background: var(--adm-text) !important;
  color: var(--adm-bg) !important;
  border: none !important;
  border-radius: var(--adm-r-sm) !important;
  font-family: 'Inter', sans-serif !important;
  font-weight: 600 !important;
  transition: all var(--adm-fast) var(--adm-ease) !important;
}
[data-variant="primary"]:hover,
button[type="submit"]:hover {
  background: #d0d0d0 !important;
  transform: translateY(-1px) !important;
  box-shadow: var(--adm-shadow-sm) !important;
}

[data-css="button"][data-variant="default"],
[data-variant="default"] {
  background: transparent !important;
  color: var(--adm-text) !important;
  border: 1px solid var(--adm-border-h) !important;
  border-radius: var(--adm-r-sm) !important;
}
[data-variant="default"]:hover { background: var(--adm-elevated) !important; }

[data-css="button"][data-variant="danger"],
[data-variant="danger"] {
  background: rgba(245,101,101,0.08) !important;
  color: var(--adm-red) !important;
  border: 1px solid rgba(245,101,101,0.22) !important;
  border-radius: var(--adm-r-sm) !important;
}
[data-variant="danger"]:hover { background: rgba(245,101,101,0.16) !important; }

[data-css="button"][data-variant="text"],
[data-variant="text"] {
  background: transparent !important;
  color: var(--adm-muted) !important;
  border: none !important;
}
[data-variant="text"]:hover {
  color: var(--adm-text) !important;
  background: var(--adm-elevated) !important;
}

/* action buttons in table rows */
[data-css="action-header"] button,
[data-css="actions"] a,
[data-css="actions"] button,
[data-css="record-actions"] a,
[data-css="record-actions"] button,
[data-css="table-actions"] a,
[data-css="table-actions"] button {
  background: transparent !important;
  border: 1px solid var(--adm-border) !important;
  color: var(--adm-muted) !important;
  border-radius: var(--adm-r-sm) !important;
  font-size: 12.5px !important;
  font-family: 'Inter', sans-serif !important;
  transition: all var(--adm-fast) var(--adm-ease) !important;
}
[data-css="action-header"] button:hover,
[data-css="actions"] a:hover,
[data-css="actions"] button:hover,
[data-css="record-actions"] a:hover,
[data-css="record-actions"] button:hover,
[data-css="table-actions"] a:hover,
[data-css="table-actions"] button:hover {
  border-color: var(--adm-border-h) !important;
  color: var(--adm-text) !important;
  background: var(--adm-elevated) !important;
}

/* ── React-Select (reference/FK fields) ──────────────────────────────────── */
[class*="-control"],
[class*="__control"] {
  background: var(--adm-surface) !important;
  border-color: var(--adm-border) !important;
  border-radius: var(--adm-r-sm) !important;
  box-shadow: none !important;
  min-height: 38px !important;
}
[class*="-control"]:hover,
[class*="__control"]:hover { border-color: var(--adm-border-h) !important; }

[class*="-control--is-focused"],
[class*="__control--is-focused"] {
  border-color: var(--adm-accent) !important;
  box-shadow: 0 0 0 3px var(--adm-border-focus) !important;
}

[class*="-menu"], [class*="__menu"] {
  background: var(--adm-card) !important;
  border: 1px solid var(--adm-border-h) !important;
  border-radius: var(--adm-r-md) !important;
  box-shadow: var(--adm-shadow-md) !important;
}

[class*="-option"], [class*="__option"] {
  background: transparent !important;
  color: var(--adm-muted) !important;
  font-size: 13.5px !important;
  transition: all var(--adm-fast) !important;
}
[class*="-option"]:hover,
[class*="__option"]:hover,
[class*="-option--is-focused"],
[class*="__option--is-focused"] {
  background: var(--adm-elevated) !important;
  color: var(--adm-text) !important;
}
[class*="-option--is-selected"],
[class*="__option--is-selected"] {
  background: var(--adm-adim) !important;
  color: var(--adm-accent) !important;
}

[class*="-singleValue"],  [class*="__singleValue"]  { color: var(--adm-text) !important; }
[class*="-placeholder"],  [class*="__placeholder"]  { color: var(--adm-dim) !important; }
[class*="-indicatorSeparator"], [class*="__indicatorSeparator"] {
  background: var(--adm-border) !important;
}
[class*="-dropdownIndicator"] svg,
[class*="__dropdownIndicator"] svg,
[class*="-clearIndicator"] svg,
[class*="__clearIndicator"] svg { color: var(--adm-dim) !important; }

/* ── Pagination ──────────────────────────────────────────────────────────── */
[data-css="paginate"] button,
[data-css="pagination"] button {
  background: transparent !important;
  border: 1px solid var(--adm-border) !important;
  color: var(--adm-muted) !important;
  min-width: 32px !important;
  height: 32px !important;
  padding: 0 9px !important;
  border-radius: var(--adm-r-sm) !important;
  font-size: 13px !important;
  font-family: 'Inter', sans-serif !important;
}
[data-css="paginate"] button:hover,
[data-css="pagination"] button:hover {
  border-color: var(--adm-border-h) !important;
  color: var(--adm-text) !important;
  background: var(--adm-elevated) !important;
}
[data-css="paginate"] button[aria-current="page"],
[data-css="paginate"] button.active {
  background: var(--adm-elevated) !important;
  border-color: var(--adm-border-h) !important;
  color: var(--adm-text) !important;
}

/* ── Filter / Drawer ─────────────────────────────────────────────────────── */
[data-css="filter"],
[data-css="filter-wrapper"],
[data-css="drawer"] {
  background: var(--adm-surface) !important;
  border-left: 1px solid var(--adm-border) !important;
}

/* ── Dropdown menus ──────────────────────────────────────────────────────── */
[data-css="dropdown"],
[data-css="dropdown-menu"],
[class*="DropDown__"],
[class*="Dropdown__"] {
  background: var(--adm-card) !important;
  border: 1px solid var(--adm-border-h) !important;
  border-radius: var(--adm-r-md) !important;
  box-shadow: var(--adm-shadow-md) !important;
  overflow: hidden !important;
}
[data-css="dropdown"] li,
[data-css="dropdown-menu"] li {
  color: var(--adm-muted) !important;
  font-size: 13.5px !important;
  padding: 9px 16px !important;
  cursor: pointer !important;
  transition: all var(--adm-fast) !important;
}
[data-css="dropdown"] li:hover,
[data-css="dropdown-menu"] li:hover {
  background: var(--adm-elevated) !important;
  color: var(--adm-text) !important;
}

/* ── Notice / Toast ──────────────────────────────────────────────────────── */
[data-css="notice"],
[data-css="notification"],
.adminjs_Notice {
  background: var(--adm-card) !important;
  border: 1px solid var(--adm-border-h) !important;
  border-radius: var(--adm-r-md) !important;
  box-shadow: var(--adm-shadow-md) !important;
  color: var(--adm-text) !important;
  font-size: 13.5px !important;
  font-family: 'Inter', sans-serif !important;
}

/* ── Checkbox / Radio ────────────────────────────────────────────────────── */
input[type="checkbox"],
input[type="radio"] { accent-color: var(--adm-accent) !important; }

/* ── Modal ───────────────────────────────────────────────────────────────── */
[data-css="modal"], .adminjs_Modal {
  background: var(--adm-card) !important;
  border: 1px solid var(--adm-border-h) !important;
  border-radius: var(--adm-r-xl) !important;
  box-shadow: var(--adm-shadow-lg) !important;
}
[data-css="modal-overlay"], .adminjs_ModalOverlay {
  background: rgba(0,0,0,0.72) !important;
  backdrop-filter: blur(4px) !important;
}

/* ── Login ───────────────────────────────────────────────────────────────── */
.adminjs_Login {
  background: var(--adm-bg) !important;
}
.adminjs_Login form {
  background: var(--adm-card) !important;
  border: 1px solid var(--adm-border) !important;
  border-radius: var(--adm-r-xl) !important;
  padding: 40px 36px !important;
  max-width: 400px !important;
  box-shadow: var(--adm-shadow-lg) !important;
}
.adminjs_Login h1,
.adminjs_Login [data-css="h1"] {
  font-size: 22px !important;
  font-weight: 700 !important;
  letter-spacing: -0.5px !important;
  color: var(--adm-text) !important;
}
.adminjs_Login label { color: var(--adm-muted) !important; font-size: 13px !important; }
.adminjs_Login input[type="email"],
.adminjs_Login input[type="password"] {
  background: var(--adm-surface) !important;
  border-color: var(--adm-border) !important;
  color: var(--adm-text) !important;
  height: 40px !important;
}
.adminjs_Login button[type="submit"] {
  background: var(--adm-text) !important;
  color: var(--adm-bg) !important;
  width: 100% !important;
  height: 40px !important;
  margin-top: 10px !important;
  font-weight: 600 !important;
  border-radius: var(--adm-r-sm) !important;
  border: none !important;
}
.adminjs_Login button[type="submit"]:hover {
  background: #d0d0d0 !important;
  transform: translateY(-1px) !important;
}

/* ═══════════════════════════════════════════════════════════════════════════
   VALIDATION / ERROR STATES
   ═══════════════════════════════════════════════════════════════════════════ */
input[aria-invalid="true"],
select[aria-invalid="true"],
textarea[aria-invalid="true"] {
  border-color: var(--adm-red) !important;
  box-shadow: 0 0 0 3px rgba(245,101,101,0.15) !important;
}
[data-css="error"],
[data-css="input-group--error"] [data-css="caption"],
[class*="errorMessage"],
[class*="ErrorMessage"] {
  color: var(--adm-red) !important;
  font-size: 12px !important;
  margin-top: 4px !important;
  display: block !important;
}
[data-css="required-icon"],
[class*="requiredIcon"] { color: var(--adm-red) !important; }

[data-css="notice"][data-type="error"],
[data-css="notification"][data-type="error"] {
  background: rgba(245,101,101,0.08) !important;
  border-left: 3px solid var(--adm-red) !important;
  color: #fca5a5 !important;
}
[data-css="notice"][data-type="success"],
[data-css="notification"][data-type="success"] {
  background: rgba(62,207,142,0.08) !important;
  border-left: 3px solid var(--adm-green) !important;
  color: #86efac !important;
}

/* ═══════════════════════════════════════════════════════════════════════════
   RESPONSIVE — TABLET (≤ 1024px)
   ═══════════════════════════════════════════════════════════════════════════ */
@media (max-width: 1024px) {
  [data-css="sidebar"] {
    transform: translateX(-100%) !important;
    transition: transform 0.25s cubic-bezier(0.16,1,0.3,1) !important;
  }
  [data-css="app-content"] {
    margin-left: 0 !important;
    padding: 20px 16px !important;
  }
  [data-css="table-wrapper"],
  [data-css="records-table-wrapper"] {
    overflow-x: auto !important;
  }
  table { display: block !important; overflow-x: auto !important; }
}

/* ═══════════════════════════════════════════════════════════════════════════
   RESPONSIVE — MOBILE (≤ 768px)
   ═══════════════════════════════════════════════════════════════════════════ */
@media (max-width: 768px) {
  [data-css="app-content"] {
    margin-top: 56px !important;
    padding: 12px !important;
  }
  thead th, tbody td {
    font-size: 12px !important;
    padding: 8px 10px !important;
    white-space: nowrap !important;
  }
  input[type="text"],
  input[type="email"],
  input[type="number"],
  input[type="password"],
  select, textarea {
    font-size: 16px !important;
    min-height: 44px !important;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   RESPONSIVE — LOGIN (≤ 480px)
   ═══════════════════════════════════════════════════════════════════════════ */
@media (max-width: 480px) {
  .adminjs_Login form {
    padding: 28px 20px !important;
    border-radius: var(--adm-r-lg) !important;
    margin: 0 16px !important;
  }
}
`,

  'src/public/index.html': `<!DOCTYPE html>
<html lang="es" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Fábrica — Gestión de Piezas y Herramientas</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    /* ─── Tokens ─────────────────────────────────────────────── */
    :root {
      --bg-base:    #080808;
      --bg-surface: #101010;
      --bg-card:    #161616;
      --bg-elevated:#1e1e1e;
      --bg-hover:   #242424;

      --border:       rgba(255,255,255,0.07);
      --border-hover: rgba(255,255,255,0.13);
      --border-focus: rgba(91,138,245,0.5);

      --text-primary:   #ebebeb;
      --text-secondary: #888;
      --text-muted:     #555;

      --accent:       #5b8af5;
      --accent-dim:   rgba(91,138,245,0.12);
      --accent-hover: #4a79e4;

      --green:     #3ecf8e;
      --green-dim: rgba(62,207,142,0.12);
      --amber:     #f5a623;
      --amber-dim: rgba(245,166,35,0.12);
      --red:       #f56565;

      --radius-xs: 4px;
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
      --radius-xl: 20px;

      --shadow-xs: 0 1px 2px rgba(0,0,0,0.5);
      --shadow-sm: 0 2px 8px rgba(0,0,0,0.5);
      --shadow-md: 0 4px 20px rgba(0,0,0,0.6);
      --shadow-lg: 0 12px 40px rgba(0,0,0,0.7);

      --ease:   cubic-bezier(0.16,1,0.3,1);
      --fast:   150ms;
      --normal: 220ms;

      --font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --mono: 'JetBrains Mono', 'Fira Code', monospace;
    }

    /* ─── Reset ──────────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: var(--font);
      font-size: 15px;
      line-height: 1.6;
      background: var(--bg-base);
      color: var(--text-primary);
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }
    a { color: inherit; text-decoration: none; }
    button { cursor: pointer; font-family: var(--font); border: none; background: none; }
    input, select { font-family: var(--font); }
    ul { list-style: none; }

    .container {
      max-width: 1120px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* ─── Navbar ─────────────────────────────────────────────── */
    .nav {
      position: sticky;
      top: 0;
      z-index: 100;
      height: 56px;
      display: flex;
      align-items: center;
      border-bottom: 1px solid var(--border);
      background: rgba(8,8,8,0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }
    .nav__inner {
      display: flex;
      align-items: center;
      width: 100%;
    }
    .nav__logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 15px;
      letter-spacing: -0.2px;
      color: var(--text-primary);
      flex-shrink: 0;
      margin-right: 32px;
    }
    .nav__logo-mark {
      width: 26px;
      height: 26px;
      background: var(--accent);
      border-radius: var(--radius-sm);
      display: grid;
      place-items: center;
    }
    .nav__logo-mark svg { width: 14px; height: 14px; }
    .nav__links {
      display: flex;
      align-items: center;
      gap: 2px;
      flex: 1;
    }
    .nav__link {
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: 14px;
      color: var(--text-secondary);
      transition: color var(--fast) var(--ease), background var(--fast) var(--ease);
      font-weight: 450;
    }
    .nav__link:hover { color: var(--text-primary); background: var(--bg-elevated); }
    .nav__link.active { color: var(--text-primary); }
    .nav__actions { display: flex; align-items: center; gap: 8px; }
    .nav__badge {
      font-size: 11px;
      font-weight: 500;
      padding: 2px 7px;
      border-radius: 20px;
      background: var(--accent-dim);
      color: var(--accent);
      border: 1px solid rgba(91,138,245,0.2);
    }

    /* ─── Buttons ────────────────────────────────────────────── */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      font-size: 14px;
      font-weight: 500;
      transition: all var(--fast) var(--ease);
      white-space: nowrap;
      letter-spacing: -0.1px;
    }
    .btn svg { flex-shrink: 0; }

    .btn-primary { background: var(--text-primary); color: var(--bg-base); }
    .btn-primary:hover {
      background: #d0d0d0;
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
    .btn-primary:active { transform: translateY(0); }

    .btn-secondary {
      background: transparent;
      color: var(--text-primary);
      border: 1px solid var(--border-hover);
    }
    .btn-secondary:hover { background: var(--bg-elevated); }

    .btn-accent { background: var(--accent); color: #fff; }
    .btn-accent:hover {
      background: var(--accent-hover);
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(91,138,245,0.35);
    }

    .btn-ghost { background: transparent; color: var(--text-secondary); padding: 6px 10px; }
    .btn-ghost:hover { color: var(--text-primary); background: var(--bg-elevated); }

    .btn-sm { padding: 5px 12px; font-size: 13px; }
    .btn-lg { padding: 11px 22px; font-size: 15px; border-radius: var(--radius-md); }

    /* ─── Hero ───────────────────────────────────────────────── */
    .hero {
      padding: 96px 0 80px;
      position: relative;
      overflow: hidden;
    }
    .hero::before {
      content: '';
      position: absolute;
      top: -120px;
      left: 50%;
      transform: translateX(-50%);
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(91,138,245,0.06) 0%, transparent 70%);
      pointer-events: none;
    }
    .hero__eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
      color: var(--accent);
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 20px;
    }
    .hero__eyebrow::before {
      content: '';
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--accent);
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }
    .hero__title {
      font-size: clamp(40px, 6vw, 72px);
      font-weight: 700;
      letter-spacing: -2.5px;
      line-height: 1.05;
      margin-bottom: 20px;
      color: var(--text-primary);
    }
    .hero__title span { color: var(--text-muted); }
    .hero__subtitle {
      font-size: 18px;
      color: var(--text-secondary);
      max-width: 480px;
      line-height: 1.6;
      margin-bottom: 36px;
      font-weight: 400;
    }
    .hero__actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 64px;
      flex-wrap: wrap;
    }

    /* Terminal snippet */
    .hero__snippet {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      max-width: 600px;
      box-shadow: var(--shadow-lg);
    }
    .snippet__bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
    }
    .snippet__dots { display: flex; gap: 6px; }
    .snippet__dot { width: 10px; height: 10px; border-radius: 50%; }
    .snippet__dot:nth-child(1) { background: #ff5f57; }
    .snippet__dot:nth-child(2) { background: #febc2e; }
    .snippet__dot:nth-child(3) { background: #28c840; }
    .snippet__label { font-size: 12px; color: var(--text-muted); font-family: var(--mono); }
    .snippet__copy {
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: var(--radius-xs);
      transition: all var(--fast) var(--ease);
    }
    .snippet__copy:hover { color: var(--text-primary); background: var(--bg-elevated); }
    .snippet__body {
      padding: 20px;
      font-family: var(--mono);
      font-size: 13px;
      line-height: 1.9;
    }
    .snippet__body .c-comment { color: var(--text-muted); }
    .snippet__body .c-cmd     { color: var(--green); }
    .snippet__body .c-arg     { color: var(--accent); }
    .snippet__body .c-str     { color: var(--amber); }
    .snippet__body .c-dim     { color: #888; }
    .snippet__body .line      { display: flex; gap: 8px; }
    .snippet__body .prompt    { color: var(--text-muted); user-select: none; }

    /* ─── Stats ──────────────────────────────────────────────── */
    .stats {
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      padding: 28px 0;
      margin-bottom: 80px;
    }
    .stats__grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
    }
    .stat { padding: 0 32px; border-right: 1px solid var(--border); }
    .stat:first-child { padding-left: 0; }
    .stat:last-child  { border-right: none; }
    .stat__value {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -1px;
      color: var(--text-primary);
    }
    .stat__label { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }

    /* ─── Section header ─────────────────────────────────────── */
    .section-header { margin-bottom: 40px; }
    .section-header__tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-muted);
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .section-header__tag::before {
      content: '';
      display: block;
      width: 16px; height: 1px;
      background: var(--border-hover);
    }
    .section-header__title {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -1px;
      color: var(--text-primary);
      margin-bottom: 8px;
    }
    .section-header__sub { font-size: 15px; color: var(--text-secondary); max-width: 480px; }

    /* ─── Cards ──────────────────────────────────────────────── */
    .cards-section { padding: 0 0 80px; }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 12px;
    }
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px;
      transition: border-color var(--normal) var(--ease),
                  background var(--normal) var(--ease),
                  transform var(--normal) var(--ease),
                  box-shadow var(--normal) var(--ease);
      position: relative;
      overflow: hidden;
      cursor: pointer;
    }
    .card::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      opacity: 0;
      transition: opacity var(--normal) var(--ease);
      background: radial-gradient(500px circle at var(--mx,50%) var(--my,50%), rgba(91,138,245,0.04), transparent 40%);
    }
    .card:hover {
      border-color: var(--border-hover);
      background: var(--bg-elevated);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .card:hover::after { opacity: 1; }

    .card__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .card__icon {
      width: 40px; height: 40px;
      border-radius: var(--radius-md);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .card__icon svg { width: 18px; height: 18px; }
    .card__icon--blue  { background: var(--accent-dim);  color: var(--accent); }
    .card__icon--green { background: var(--green-dim);  color: var(--green); }
    .card__icon--amber { background: var(--amber-dim);  color: var(--amber); }
    .card__icon--muted { background: var(--bg-elevated); color: var(--text-secondary); }

    .card__tag {
      font-size: 11px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 20px;
    }
    .tag--new    { background: var(--accent-dim); color: var(--accent); border: 1px solid rgba(91,138,245,0.2); }
    .tag--beta   { background: var(--amber-dim);  color: var(--amber);  border: 1px solid rgba(245,166,35,0.2); }
    .tag--stable { background: var(--green-dim);  color: var(--green);  border: 1px solid rgba(62,207,142,0.2); }
    .tag--default{ background: var(--bg-elevated);color: var(--text-muted); border: 1px solid var(--border); }

    .card__title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 6px;
      letter-spacing: -0.3px;
    }
    .card__desc {
      font-size: 13.5px;
      color: var(--text-secondary);
      line-height: 1.55;
      margin-bottom: 20px;
    }
    .card__meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }
    .card__count { font-size: 20px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.5px; }
    .card__count-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .card__action {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: var(--text-muted);
      transition: color var(--fast) var(--ease);
    }
    .card:hover .card__action { color: var(--accent); }
    .card__action svg { width: 14px; height: 14px; }

    /* ─── Feed ───────────────────────────────────────────────── */
    .feed-section { padding: 0 0 80px; }
    .feed-layout {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 20px;
      align-items: start;
    }
    .feed {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }
    .feed__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
    }
    .feed__title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
    .feed__filters { display: flex; gap: 2px; }
    .feed__filter {
      font-size: 12px;
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      transition: all var(--fast) var(--ease);
    }
    .feed__filter:hover, .feed__filter.active { background: var(--bg-elevated); color: var(--text-primary); }
    .feed__item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 20px;
      border-bottom: 1px solid var(--border);
      transition: background var(--fast) var(--ease);
    }
    .feed__item:last-child { border-bottom: none; }
    .feed__item:hover { background: var(--bg-elevated); }

    .feed__avatar {
      width: 32px; height: 32px;
      border-radius: var(--radius-sm);
      display: grid;
      place-items: center;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
      color: #fff;
    }
    .av--blue   { background: #3b5fc0; }
    .av--green  { background: #2a9d6e; }
    .av--amber  { background: #b8760d; }
    .av--violet { background: #6b4fbb; }
    .av--slate  { background: #3d4d66; }

    .feed__content { flex: 1; min-width: 0; }
    .feed__name {
      font-size: 13.5px;
      font-weight: 500;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .feed__sub { font-size: 12.5px; color: var(--text-secondary); margin-top: 1px; }
    .feed__right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
    .feed__amount { font-size: 13.5px; font-weight: 600; color: var(--text-primary); font-variant-numeric: tabular-nums; }
    .feed__time   { font-size: 11.5px; color: var(--text-muted); }
    .feed__status { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .status--ok   { background: var(--green); }
    .status--warn { background: var(--amber); }
    .status--err  { background: var(--red); }

    /* Sidebar panels */
    .panel {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }
    .panel__header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .panel__title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
    .panel__body  { padding: 16px 20px; }
    .panel__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--border);
      font-size: 13px;
    }
    .panel__row:last-child { border-bottom: none; }
    .panel__row-label { color: var(--text-secondary); }
    .panel__row-value { font-weight: 500; color: var(--text-primary); font-variant-numeric: tabular-nums; }

    .mini-bar { height: 4px; background: var(--bg-elevated); border-radius: 2px; overflow: hidden; margin-top: 8px; }
    .mini-bar__fill { height: 100%; border-radius: 2px; background: var(--accent); }
    .mini-bar__fill.green { background: var(--green); }
    .mini-bar__fill.amber { background: var(--amber); }

    /* ─── Inputs ─────────────────────────────────────────────── */
    .inputs-section { padding: 0 0 80px; }
    .inputs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    .form-group  { display: flex; flex-direction: column; gap: 6px; }
    .form-label  { font-size: 13px; font-weight: 500; color: var(--text-secondary); }
    .form-input  {
      height: 38px;
      padding: 0 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--bg-surface);
      color: var(--text-primary);
      font-size: 14px;
      outline: none;
      transition: border-color var(--fast) var(--ease), box-shadow var(--fast) var(--ease);
    }
    .form-input::placeholder { color: var(--text-muted); }
    .form-input:hover { border-color: var(--border-hover); }
    .form-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--border-focus); }
    .form-input.error { border-color: var(--red); box-shadow: 0 0 0 3px rgba(245,101,101,0.15); }
    .form-hint       { font-size: 12px; color: var(--text-muted); }
    .form-hint.error { color: var(--red); }
    .form-select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 32px;
    }
    .input-group .form-input { border-radius: var(--radius-sm) 0 0 var(--radius-sm); flex: 1; }
    .input-group { display: flex; }
    .input-group .btn {
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      border: 1px solid var(--border);
      border-left: none;
    }
    .search-wrap { position: relative; }
    .search-wrap .search-icon {
      position: absolute;
      left: 12px; top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    }
    .search-wrap .form-input { padding-left: 36px; }
    .btn-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 16px; }

    /* ─── Modal ──────────────────────────────────────────────── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      display: grid;
      place-items: center;
      z-index: 200;
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--normal) var(--ease);
      backdrop-filter: blur(4px);
    }
    .modal-overlay.open { opacity: 1; pointer-events: auto; }
    .modal {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      width: 100%;
      max-width: 480px;
      margin: 0 16px;
      transform: scale(0.96) translateY(8px);
      transition: transform var(--normal) var(--ease);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
    }
    .modal-overlay.open .modal { transform: scale(1) translateY(0); }
    .modal__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 24px 24px 0;
    }
    .modal__title { font-size: 17px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.3px; }
    .modal__sub   { font-size: 13.5px; color: var(--text-secondary); margin-top: 4px; }
    .modal__close {
      width: 28px; height: 28px;
      border-radius: var(--radius-sm);
      display: grid; place-items: center;
      color: var(--text-muted);
      transition: all var(--fast) var(--ease);
      flex-shrink: 0;
    }
    .modal__close:hover { background: var(--bg-elevated); color: var(--text-primary); }
    .modal__body   { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
    .modal__footer {
      padding: 16px 24px;
      border-top: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }

    /* ─── Footer ─────────────────────────────────────────────── */
    .footer { border-top: 1px solid var(--border); padding: 32px 0; }
    .footer__inner { display: flex; align-items: center; justify-content: space-between; }
    .footer__copy  { font-size: 13px; color: var(--text-muted); }
    .footer__links { display: flex; gap: 20px; }
    .footer__link  { font-size: 13px; color: var(--text-muted); transition: color var(--fast) var(--ease); }
    .footer__link:hover { color: var(--text-secondary); }

    .divider { height: 1px; background: var(--border); margin: 0 0 80px; }

    /* ─── Responsive ─────────────────────────────────────────── */
    @media (max-width: 768px) {
      .hero { padding: 64px 0 56px; }
      .hero__title { letter-spacing: -1.5px; }
      .stats__grid { grid-template-columns: repeat(2, 1fr); }
      .stat { padding: 12px 0; border-right: none; border-bottom: 1px solid var(--border); }
      .stat:nth-child(3), .stat:last-child { border-bottom: none; }
      .feed-layout { grid-template-columns: 1fr; }
      .inputs-grid { grid-template-columns: 1fr; }
      .nav__links  { display: none; }
      .footer__inner { flex-direction: column; gap: 16px; text-align: center; }
    }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border-hover); border-radius: 3px; }
    ::selection { background: rgba(91,138,245,0.25); color: var(--text-primary); }
  </style>
</head>
<body>

<!-- ── NAVBAR ───────────────────────────────────────────────── -->
<nav class="nav">
  <div class="container">
    <div class="nav__inner">
      <a href="/" class="nav__logo">
        <div class="nav__logo-mark">
          <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="5" height="5" rx="1" fill="white" fill-opacity="0.9"/>
            <rect x="8" y="1" width="5" height="5" rx="1" fill="white" fill-opacity="0.5"/>
            <rect x="1" y="8" width="5" height="5" rx="1" fill="white" fill-opacity="0.5"/>
            <rect x="8" y="8" width="5" height="5" rx="1" fill="white" fill-opacity="0.3"/>
          </svg>
        </div>
        Fábrica
      </a>
      <ul class="nav__links">
        <li><a class="nav__link active" href="#modulos">Módulos</a></li>
        <li><a class="nav__link" href="#produccion">Producción</a></li>
        <li><a class="nav__link" href="#ventas">Ventas</a></li>
        <li><a class="nav__link" href="#clientes">Clientes</a></li>
        <li><a class="nav__link" href="#ui">Componentes</a></li>
      </ul>
      <div class="nav__actions">
        <span class="nav__badge">v1.0</span>
        <a class="btn btn-primary btn-sm" href="/admin">Panel →</a>
      </div>
    </div>
  </div>
</nav>

<!-- ── HERO ─────────────────────────────────────────────────── -->
<section class="hero">
  <div class="container">
    <div class="hero__eyebrow">Grupo 7 · Express + Docker</div>
    <h1 class="hero__title">
      Gestión industrial,<br/>
      <span>sin fricción.</span>
    </h1>
    <p class="hero__subtitle">
      Administrá piezas, componentes, ensamblajes y ventas desde un único panel.
      Dockerizado, listo para producción.
    </p>
    <div class="hero__actions">
      <a class="btn btn-primary btn-lg" href="/admin">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Ir al Panel
      </a>
      <a class="btn btn-secondary btn-lg" href="#modulos">Ver módulos</a>
    </div>

  </div>
</section>

<!-- ── STATS ─────────────────────────────────────────────────── -->
<section class="stats">
  <div class="container">
    <div class="stats__grid">
      <div class="stat">
        <div class="stat__value">10</div>
        <div class="stat__label">Modelos Sequelize</div>
      </div>
      <div class="stat">
        <div class="stat__value">5</div>
        <div class="stat__label">Módulos de gestión</div>
      </div>
      <div class="stat">
        <div class="stat__value">100%</div>
        <div class="stat__label">CRUD automático</div>
      </div>
      <div class="stat">
        <div class="stat__value">ES2023</div>
        <div class="stat__label">Node 22 · Alpine</div>
      </div>
    </div>
  </div>
</section>

<!-- ── CARDS ─────────────────────────────────────────────────── -->
<section class="cards-section" id="modulos">
  <div class="container">
    <div class="section-header">
      <div class="section-header__tag">Módulos</div>
      <h2 class="section-header__title">Todo el negocio, cubierto.</h2>
    </div>
    <div class="cards-grid">

      <div class="card" onclick="location.href='/admin/resources/Pieza'">
        <div class="card__header">
          <div class="card__icon card__icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <span class="card__tag tag--stable">Producción</span>
        </div>
        <div class="card__title">Piezas</div>
        <div class="card__meta">
          <div>
            <div class="card__count">3</div>
            <div class="card__count-label">registros</div>
          </div>
          <div class="card__action">
            Ver piezas
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>

      <div class="card" onclick="location.href='/admin/resources/Componente'">
        <div class="card__header">
          <div class="card__icon card__icon--amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
          </div>
          <span class="card__tag tag--stable">Maestros</span>
        </div>
        <div class="card__title">Componentes</div>
        <div class="card__meta">
          <div>
            <div class="card__count">6</div>
            <div class="card__count-label">registros</div>
          </div>
          <div class="card__action">
            Ver componentes
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>

      <div class="card" onclick="location.href='/admin/resources/Venta'">
        <div class="card__header">
          <div class="card__icon card__icon--green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <span class="card__tag tag--new">Nuevo</span>
        </div>
        <div class="card__title">Ventas</div>
        <div class="card__meta">
          <div>
            <div class="card__count">—</div>
            <div class="card__count-label">registros</div>
          </div>
          <div class="card__action">
            Ver ventas
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>

      <div class="card" onclick="location.href='/admin/resources/Cliente'" id="clientes">
        <div class="card__header">
          <div class="card__icon card__icon--muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <span class="card__tag tag--default">Clientes</span>
        </div>
        <div class="card__title">Clientes</div>
        <div class="card__meta">
          <div>
            <div class="card__count">—</div>
            <div class="card__count-label">registros</div>
          </div>
          <div class="card__action">
            Ver clientes
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>

      <div class="card" onclick="location.href='/admin/resources/Ensamblaje'" id="produccion">
        <div class="card__header">
          <div class="card__icon card__icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
          </div>
          <span class="card__tag tag--beta">Beta</span>
        </div>
        <div class="card__title">Ensamblajes</div>
        <div class="card__meta">
          <div>
            <div class="card__count">8</div>
            <div class="card__count-label">relaciones</div>
          </div>
          <div class="card__action">
            Ver ensamblajes
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>

      <div class="card" onclick="location.href='/admin/resources/Provincia'">
        <div class="card__header">
          <div class="card__icon card__icon--muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <span class="card__tag tag--stable">Geografía</span>
        </div>
        <div class="card__title">Geografía</div>
        <div class="card__meta">
          <div>
            <div class="card__count">3</div>
            <div class="card__count-label">tablas</div>
          </div>
          <div class="card__action">
            Ver provincias
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>

<div class="divider"></div>

<!-- ── FEED ──────────────────────────────────────────────────── -->
<section class="feed-section" id="ventas">
  <div class="container">
    <div class="section-header">
      <div class="section-header__tag">Actividad</div>
      <h2 class="section-header__title">Estado de producción.</h2>
      <p class="section-header__sub">Catálogo activo con precios calculados automáticamente desde los ensamblajes.</p>
    </div>
    <div class="feed-layout">
      <div class="feed">
        <div class="feed__header">
          <span class="feed__title">Catálogo de Piezas</span>
          <div class="feed__filters">
            <button class="feed__filter active">Todas</button>
            <button class="feed__filter">Herramientas</button>
            <button class="feed__filter">Piezas</button>
          </div>
        </div>

        <div class="feed__item">
          <div class="feed__avatar av--blue">EJ</div>
          <div class="feed__content">
            <div class="feed__name">Eje de Transmisión</div>
            <div class="feed__sub">Acero 1.5kg · 2 Rulemanes · Ganancia 1.5×</div>
          </div>
          <div class="feed__right">
            <div class="feed__amount">$1,825</div>
            <div class="feed__time">Precio calculado</div>
          </div>
          <div class="feed__status status--ok"></div>
        </div>

        <div class="feed__item">
          <div class="feed__avatar av--violet">EH</div>
          <div class="feed__content">
            <div class="feed__name">Engranaje Helicoidal</div>
            <div class="feed__sub">Bronce 0.8kg · 1 Rulemán · 4 Tornillos · Ganancia 1.8×</div>
          </div>
          <div class="feed__right">
            <div class="feed__amount">$2,275</div>
            <div class="feed__time">Precio calculado</div>
          </div>
          <div class="feed__status status--ok"></div>
        </div>

        <div class="feed__item">
          <div class="feed__avatar av--amber">PP</div>
          <div class="feed__content">
            <div class="feed__name">Pinza de Presión</div>
            <div class="feed__sub">Acero 0.5kg · 6 Tornillos · 6 Tuercas · Herramienta</div>
          </div>
          <div class="feed__right">
            <div class="feed__amount">$990</div>
            <div class="feed__time">Precio calculado</div>
          </div>
          <div class="feed__status status--warn"></div>
        </div>

        <div class="feed__item">
          <div class="feed__avatar av--slate">UM</div>
          <div class="feed__content">
            <div class="feed__name">Unidades de Medida</div>
            <div class="feed__sub">KILO · UNIDAD — 2 registros activos</div>
          </div>
          <div class="feed__right">
            <div class="feed__amount">2</div>
            <div class="feed__time">Maestro</div>
          </div>
          <div class="feed__status status--ok"></div>
        </div>

        <div class="feed__item">
          <div class="feed__avatar av--green">DB</div>
          <div class="feed__content">
            <div class="feed__name">Base de datos</div>
            <div class="feed__sub">PostgreSQL 17 · migrations aplicadas · seeders cargados</div>
          </div>
          <div class="feed__right">
            <div class="feed__amount">10</div>
            <div class="feed__time">Tablas activas</div>
          </div>
          <div class="feed__status status--ok"></div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="panel">
          <div class="panel__header">
            <span class="panel__title">Stack técnico</span>
            <span class="card__tag tag--stable" style="font-size:11px;padding:2px 8px;">Online</span>
          </div>
          <div class="panel__body">
            <div class="panel__row"><span class="panel__row-label">Runtime</span><span class="panel__row-value">Node.js 22</span></div>
            <div class="panel__row"><span class="panel__row-label">Framework</span><span class="panel__row-value">Express 4</span></div>
            <div class="panel__row"><span class="panel__row-label">ORM</span><span class="panel__row-value">Sequelize 6</span></div>
            <div class="panel__row"><span class="panel__row-label">Base de datos</span><span class="panel__row-value">PostgreSQL 17</span></div>
            <div class="panel__row"><span class="panel__row-label">Admin panel</span><span class="panel__row-value">AdminJS 7</span></div>
            <div class="panel__row"><span class="panel__row-label">Infra</span><span class="panel__row-value">Docker Alpine</span></div>
          </div>
        </div>

        <div class="panel">
          <div class="panel__header"><span class="panel__title">Cobertura de datos</span></div>
          <div class="panel__body">
            <div style="margin-bottom:14px;">
              <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
                <span style="color:var(--text-secondary);">Componentes</span>
                <span style="color:var(--text-primary);font-weight:500;">6 registros</span>
              </div>
              <div class="mini-bar"><div class="mini-bar__fill" style="width:60%;"></div></div>
            </div>
            <div style="margin-bottom:14px;">
              <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
                <span style="color:var(--text-secondary);">Piezas</span>
                <span style="color:var(--text-primary);font-weight:500;">3 registros</span>
              </div>
              <div class="mini-bar"><div class="mini-bar__fill green" style="width:30%;"></div></div>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
                <span style="color:var(--text-secondary);">Ensamblajes</span>
                <span style="color:var(--text-primary);font-weight:500;">8 relaciones</span>
              </div>
              <div class="mini-bar"><div class="mini-bar__fill amber" style="width:80%;"></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<div class="divider"></div>

<!-- ── ACCESO ─────────────────────────────────────────────────── -->
<section class="inputs-section" id="ui">
  <div class="container">
    <div class="section-header">
      <div class="section-header__tag">Acceso</div>
      <h2 class="section-header__title">Panel de administración.</h2>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;max-width:900px;">

      <div class="panel" style="border-radius:var(--radius-lg);">
        <div class="panel__header">
          <span class="panel__title">Credenciales</span>
          <span class="card__tag tag--stable" style="font-size:11px;padding:2px 8px;">Por defecto</span>
        </div>
        <div class="panel__body">
          <div class="panel__row">
            <span class="panel__row-label">Email</span>
            <span class="panel__row-value" style="font-family:var(--mono);font-size:12px;">admin@example.com</span>
          </div>
          <div class="panel__row">
            <span class="panel__row-label">Contraseña</span>
            <span class="panel__row-value" style="font-family:var(--mono);font-size:12px;">admin123</span>
          </div>
          <div class="panel__row">
            <span class="panel__row-label">URL</span>
            <a href="/admin" style="color:var(--accent);font-size:13px;font-family:var(--mono);">localhost:3000/admin</a>
          </div>
        </div>
      </div>

      <div class="panel" style="border-radius:var(--radius-lg);">
        <div class="panel__header"><span class="panel__title">Stack técnico</span></div>
        <div class="panel__body">
          <div class="panel__row"><span class="panel__row-label">Runtime</span><span class="panel__row-value">Node.js 22</span></div>
          <div class="panel__row"><span class="panel__row-label">Framework</span><span class="panel__row-value">Express 4</span></div>
          <div class="panel__row"><span class="panel__row-label">ORM</span><span class="panel__row-value">Sequelize 6</span></div>
          <div class="panel__row"><span class="panel__row-label">Base de datos</span><span class="panel__row-value">PostgreSQL 17</span></div>
          <div class="panel__row"><span class="panel__row-label">Admin panel</span><span class="panel__row-value">AdminJS 7</span></div>
        </div>
      </div>

      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;display:flex;flex-direction:column;justify-content:space-between;gap:20px;">
        <div>
          <div style="font-size:15px;font-weight:600;color:var(--text-primary);margin-bottom:8px;">Ir al panel</div>
          <div style="font-size:13.5px;color:var(--text-secondary);line-height:1.6;">CRUD completo sobre los 10 modelos. Búsqueda, filtros y validación incluidos.</div>
        </div>
        <a class="btn btn-primary" href="/admin" style="align-self:flex-start;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Abrir panel →
        </a>
      </div>

    </div>
  </div>
</section>

<!-- ── FOOTER ─────────────────────────────────────────────────── -->
<footer class="footer">
  <div class="container">
    <div class="footer__inner">
      <span class="footer__copy">Fábrica de Piezas y Herramientas · Grupo 7 · 2025</span>
      <div class="footer__links">
        <a class="footer__link" href="/admin">Panel Admin</a>
        <a class="footer__link" href="#modulos">Módulos</a>
        <a class="footer__link" href="https://expressjs.com/" target="_blank" rel="noopener">Express</a>
        <a class="footer__link" href="https://sequelize.org/" target="_blank" rel="noopener">Sequelize</a>
      </div>
    </div>
  </div>
</footer>

<script>
  // Card hover spotlight effect
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', \`\${e.clientX - r.left}px\`);
      card.style.setProperty('--my', \`\${e.clientY - r.top}px\`);
    });
  });

  // Feed filters
  document.querySelectorAll('.feed__filter').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.feed__filters').querySelectorAll('.feed__filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
</script>
</body>
</html>
`,

  'src/seeders/001-initial-data.js': `// src/seeders/001-initial-data.js
'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('unidades_medida', [
      { id: 1, nombre: 'KILO' },
      { id: 2, nombre: 'UNIDAD' },
      { id: 3, nombre: 'LITRO' },
      { id: 4, nombre: 'METRO' },
    ]);

    await queryInterface.bulkInsert('componentes', [
      { id: 1, nombre: 'ACERO',   costo: 500.00,  unidad_medida_id: 1 },
      { id: 2, nombre: 'BRONCE',  costo: 800.00,  unidad_medida_id: 1 },
      { id: 3, nombre: 'TORNILLO', costo: 20.00,  unidad_medida_id: 2 },
      { id: 4, nombre: 'TUERCA',   costo: 10.00,  unidad_medida_id: 2 },
      { id: 5, nombre: 'RULEMÁN',  costo: 350.00, unidad_medida_id: 2 },
      { id: 6, nombre: 'PINTURA ANTICORROSIVA', costo: 150.00, unidad_medida_id: 3 },
      { id: 7, nombre: 'CABLE DE COBRE 4MM', costo: 120.00, unidad_medida_id: 4 },
      { id: 8, nombre: 'GRASA GRAFITADA', costo: 250.00, unidad_medida_id: 3 },
      { id: 9, nombre: 'CHAPA DE HIERRO', costo: 900.00, unidad_medida_id: 1 },
      { id: 10, nombre: 'RESORTE DE TENSIÓN', costo: 85.00, unidad_medida_id: 2 },
    ]);

    await queryInterface.bulkInsert('piezas', [
      { id: 1, nombre: 'EJE DE TRANSMISIÓN', ganancia: 1.50, es_herramienta: false },
      { id: 2, nombre: 'ENGRANAJE HELICOIDAL', ganancia: 1.80, es_herramienta: false },
      { id: 3, nombre: 'PINZA DE PRESIÓN', ganancia: 2.20, es_herramienta: true },
      { id: 4, nombre: 'TALADRO DE BANCO T-100', ganancia: 2.50, es_herramienta: true },
      { id: 5, nombre: 'ACOPLE FLEXIBLE ACERO', ganancia: 1.60, es_herramienta: false },
      { id: 6, nombre: 'MOTOR REDUCTOR 1HP', ganancia: 2.10, es_herramienta: false },
      { id: 7, nombre: 'LLAVE FRANCESA 12IN', ganancia: 1.95, es_herramienta: true },
    ]);

    await queryInterface.bulkInsert('ensamblajes', [
      { id: 1, cantidad: 1.50, componente_id: 1, pieza_id: 1 },
      { id: 2, cantidad: 2.00, componente_id: 5, pieza_id: 1 },
      { id: 3, cantidad: 0.10, componente_id: 8, pieza_id: 1 },
      { id: 4, cantidad: 0.80, componente_id: 2, pieza_id: 2 },
      { id: 5, cantidad: 1.00, componente_id: 5, pieza_id: 2 },
      { id: 6, cantidad: 4.00, componente_id: 3, pieza_id: 2 },
      { id: 7, cantidad: 0.50, componente_id: 1, pieza_id: 3 },
      { id: 8, cantidad: 6.00, componente_id: 3, pieza_id: 3 },
      { id: 9, cantidad: 6.00, componente_id: 4, pieza_id: 3 },
      { id: 10, cantidad: 0.20, componente_id: 6, pieza_id: 3 },
      { id: 11, cantidad: 4.50, componente_id: 9, pieza_id: 4 },
      { id: 12, cantidad: 1.20, componente_id: 6, pieza_id: 4 },
      { id: 13, cantidad: 3.00, componente_id: 7, pieza_id: 4 },
      { id: 14, cantidad: 10.00, componente_id: 3, pieza_id: 4 },
      { id: 15, cantidad: 2.00, componente_id: 9, pieza_id: 6 },
      { id: 16, cantidad: 4.00, componente_id: 5, pieza_id: 6 },
      { id: 17, cantidad: 8.00, componente_id: 7, pieza_id: 6 },
    ]);

    await queryInterface.bulkInsert('provincias', [
      { id: 1, nombre: 'CÓRDOBA' },
      { id: 2, nombre: 'BUENOS AIRES' },
      { id: 3, nombre: 'SANTA FE' },
      { id: 4, nombre: 'MENDOZA' },
    ]);

    await queryInterface.bulkInsert('localidades', [
      { id: 1, nombre: 'CÓRDOBA CAPITAL' },
      { id: 2, nombre: 'VILLA MARÍA' },
      { id: 3, nombre: 'ROSARIO' },
      { id: 4, nombre: 'LA PLATA' },
      { id: 5, nombre: 'MENDOZA CAPITAL' },
    ]);

    await queryInterface.bulkInsert('barrios', [
      { id: 1, nombre: 'CENTRO' },
      { id: 2, nombre: 'LAMADRID' },
      { id: 3, nombre: 'AMEGHINO' },
      { id: 4, nombre: 'ALBERDI' },
      { id: 5, nombre: 'GENERAL PAZ' },
      { id: 6, nombre: 'NUEVA CÓRDOBA' },
    ]);

    const nombres = ['JUAN', 'PEDRO', 'MARIA', 'ANA', 'CARLOS', 'LUCIA', 'MARTIN', 'SOFIA', 'DIEGO', 'LAURA', 'ESTEBAN', 'VALENTINA', 'JAVIER', 'CAMILA', 'ALEJANDRO', 'JULIETA'];
    const apellidos = ['GOMEZ', 'RODRIGUEZ', 'GONZALEZ', 'FERNANDEZ', 'LOPEZ', 'MARTINEZ', 'DIAZ', 'PEREZ', 'SÁNCHEZ', 'ROMERO', 'ALVAREZ', 'RUIZ'];
    const clientes = [];

    for (let i = 1; i <= 60; i++) {
      const nombreCompleto = \`\${nombres[i % nombres.length]} \${apellidos[(i * 3) % apellidos.length]}\`;
      clientes.push({
        id: i,
        nombre: nombreCompleto,
        numero_documento: 20000000 + i * 153247,
        direccion: \`CALLE FALSA \${100 + i * 12}\`,
        celular: 3510000000 + i * 2314,
        telefono: 3514000000 + i * 124,
        email: \`\${nombres[i % nombres.length].toLowerCase()}.\${apellidos[(i * 3) % apellidos.length].toLowerCase()}@example.com\`,
        barrio_id: (i % 6) + 1,
        localidad_id: (i % 5) + 1,
        provincia_id: (i % 4) + 1,
      });
    }
    await queryInterface.bulkInsert('clientes', clientes);

    const ventas = [];
    const baseTime = new Date('2025-01-01').getTime();
    for (let i = 1; i <= 120; i++) {
      const date = new Date(baseTime + i * 3.5 * 24 * 60 * 60 * 1000);
      ventas.push({
        id: i,
        fecha: date.toISOString().split('T')[0],
        cliente_id: (i % 60) + 1,
      });
    }
    await queryInterface.bulkInsert('ventas', ventas);

    const detalles = [];
    let detalleId = 1;
    for (let i = 1; i <= 120; i++) {
      const lineas = (i % 3) + 1;
      for (let j = 0; j < lineas; j++) {
        detalles.push({
          id: detalleId++,
          venta_id: i,
          pieza_id: ((i + j) % 7) + 1,
          cantidad: (j + 1) * 3,
        });
      }
    }
    await queryInterface.bulkInsert('detalle_ventas', detalles);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('detalle_ventas', null, {});
    await queryInterface.bulkDelete('ventas', null, {});
    await queryInterface.bulkDelete('clientes', null, {});
    await queryInterface.bulkDelete('barrios', null, {});
    await queryInterface.bulkDelete('localidades', null, {});
    await queryInterface.bulkDelete('provincias', null, {});
    await queryInterface.bulkDelete('ensamblajes', null, {});
    await queryInterface.bulkDelete('piezas', null, {});
    await queryInterface.bulkDelete('componentes', null, {});
    await queryInterface.bulkDelete('unidades_medida', null, {});
  },
};
`,

  'src/seeders/package.json': `{ "type": "commonjs" }
`,

};

// 2. Create the target project directory if it doesn't exist
const targetDir = path.join(__dirname, 'fabrica');

if (!fs.existsSync(targetDir)) {
  console.log(`Creating directory: ${targetDir}`);
  fs.mkdirSync(targetDir, { recursive: true });
}

// 3. Write files recursively
Object.keys(files).forEach((relativePath) => {
  const filePath = path.join(targetDir, relativePath);
  const fileDir = path.dirname(filePath);

  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir, { recursive: true });
  }

  console.log(`Writing: ${relativePath}`);
  fs.writeFileSync(filePath, files[relativePath], 'utf8');
});

console.log('\x1b[32m%s\x1b[0m', '\nAll application files and folders successfully generated!\n');

// 4. Check for Docker (First Windows/Host, then Linux/WSL fallback)
try {
  let dockerPrefix = '';
  let wslTargetDir = targetDir;

  console.log('Checking if Docker is running on Windows/Host...');
  try {
    execSync('docker info', { stdio: 'ignore' });
    console.log('\x1b[32m%s\x1b[0m', 'Docker is running natively on the host!\n');
  } catch (err) {
    if (process.platform === 'win32') {
      console.log('Docker is not running natively on Windows. Checking fallback to Linux/WSL...');
      try {
        execSync('wsl docker info', { stdio: 'ignore' });
        dockerPrefix = 'wsl';
        console.log('\x1b[32m%s\x1b[0m', 'Docker is running inside default WSL distro!\n');
      } catch (wslErr) {
        try {
          execSync('wsl -d archlinux docker info', { stdio: 'ignore' });
          dockerPrefix = 'wsl -d archlinux';
          console.log('\x1b[32m%s\x1b[0m', 'Docker is running inside WSL archlinux distro!\n');
        } catch (archErr) {
          console.log('\x1b[31m%s\x1b[0m', 'Docker daemon was not found on Windows or inside WSL.\n');
          throw new Error('Docker daemon is not running on host or WSL.');
        }
      }
    } else {
      throw err;
    }
  }

  // When Docker runs inside WSL, convert the Windows path to a WSL path
  // so that all subsequent commands (docker compose, npm, npx) run from the right directory
  if (dockerPrefix) {
    try {
      const escaped = targetDir.replace(/\\/g, '/');
      wslTargetDir = execSync(`${dockerPrefix} wslpath "${escaped}"`).toString().trim();
    } catch (e) {
      wslTargetDir = targetDir
        .replace(/^([A-Za-z]):/, (_, l) => `/mnt/${l.toLowerCase()}`)
        .replace(/\\/g, '/');
    }
  }

  // Run a command in the correct environment: native cwd or WSL bash
  const run = (cmd, opts = {}) => {
    if (dockerPrefix) {
      execSync(`${dockerPrefix} bash -c "cd '${wslTargetDir}' && ${cmd}"`, opts);
    } else {
      execSync(cmd, { cwd: targetDir, ...opts });
    }
  };

  const runOutput = (cmd) => {
    if (dockerPrefix) {
      return execSync(`${dockerPrefix} bash -c "cd '${wslTargetDir}' && ${cmd}"`).toString().trim();
    }
    return execSync(cmd, { cwd: targetDir }).toString().trim();
  };

  console.log('1. Starting database container service...');
  run('docker compose up -d db', { stdio: 'inherit' });

  console.log('\n2. Waiting for database healthcheck status...');
  let isHealthy = false;
  let retries = 15;
  while (!isHealthy && retries > 0) {
    try {
      const dbId = runOutput('docker compose ps -q db');
      const status = runOutput(`docker inspect -f "{{.State.Health.Status}}" ${dbId}`);
      if (status === 'healthy') {
        isHealthy = true;
        console.log('\x1b[32m%s\x1b[0m', 'Database is healthy!\n');
      } else {
        retries--;
        execSync('node -e "Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000)"');
      }
    } catch (e) {
      retries--;
      execSync('node -e "Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000)"');
    }
  }

  if (!isHealthy) {
    throw new Error('Database service failed to start or did not become healthy in time.');
  }

  console.log('3. Installing Node.js dependencies...');
  run('npm install', { stdio: 'inherit' });

  console.log('\n4. Running database migrations...');
  run('npx sequelize-cli db:migrate', { stdio: 'inherit' });

  console.log('\n5. Seeding database with initial mock data...');
  run('npx sequelize-cli db:seed:all', { stdio: 'inherit' });

  console.log('\x1b[32m%s\x1b[0m', '\n==========================================================');
  console.log('\x1b[32m%s\x1b[0m', ' AUTOMATED SETUP COMPLETED SUCCESSFULLY!');
  console.log('\x1b[32m%s\x1b[0m', '==========================================================');
  console.log('\x1b[36m%s\x1b[0m', ' OPCIÓN PRINCIPAL (Ejecución Nativa en Windows):');
  console.log('   1. Navega a la carpeta: cd fabrica');
  console.log('   2. Inicia la aplicación: npm start');
  console.log('\n   Servidor Express:   http://localhost:3000');
  console.log('   Panel AdminJS:      http://localhost:3000/admin');
  console.log('\n OPCIÓN ALTERNATIVA (Ejecución Completa en Docker):');
  console.log('   1. Navega a la carpeta: cd fabrica');
  console.log('   2. Inicia el contenedor: docker compose up -d backend');
  console.log('\n Credenciales predeterminadas:');
  console.log('   Email:      admin@example.com');
  console.log('   Password:   admin123');
  console.log('\x1b[32m%s\x1b[0m', '==========================================================\n');

} catch (err) {
  console.log('\x1b[31m%s\x1b[0m', '\nDocker execution step skipped or failed: ' + err.message);
  console.log('Make sure Docker is running and run manually:');
  console.log('  cd fabrica');
  console.log('  docker compose up -d db');
  console.log('  npm install');
  console.log('  npx sequelize-cli db:migrate');
  console.log('  npx sequelize-cli db:seed:all');
  console.log('  npm start\n');
}
