# Comandos — de cero hasta el final

Todo se ejecuta desde la carpeta `app/`:

```bash
cd app
```

---

## 1. Levantar la base de datos (Docker)

```bash
docker compose up -d --wait db
```

## 2. Instalar dependencias

```bash
npm install
```

## 3. Correr SOLO la migración inicial (crea las tablas, sin stock)

```bash
npx sequelize-cli db:migrate --to 20260620183850-inicial.js
```

## 4. Cargar los datos de ejemplo (seeder)

```bash
npx sequelize-cli db:seed:all
```

## 5. Correr la migración que agrega la columna stock

```bash
npx sequelize-cli db:migrate
```

## 6. Levantar el servidor

```bash
npm run dev-start
```

---

## Verificación en PostgreSQL (opcional)

```bash
# Entrar a la consola interactiva
docker exec -it app-db-1 psql -U bar_user -d bar_db
```

Dentro de psql:

```sql
\dt                              -- listar tablas
\d bebidas                       -- estructura de bebidas (ver si stock está o no)
SELECT * FROM bebidas;           -- ver los datos
SELECT name FROM "SequelizeMeta"; -- ver qué migraciones están aplicadas
\q                                -- salir
```

O en un solo comando, sin entrar a la consola:

```bash
docker exec app-db-1 psql -U bar_user -d bar_db -c "\d bebidas"
docker exec app-db-1 psql -U bar_user -d bar_db -c "SELECT name FROM \"SequelizeMeta\";"
```

---

## Comandos de mantenimiento / revertir

```bash
# Deshacer la última migración aplicada (ej: sacar la columna stock)
npx sequelize-cli db:migrate:undo

# Deshacer TODAS las migraciones
npx sequelize-cli db:migrate:undo:all

# Deshacer el último seeder
npx sequelize-cli db:seed:undo

# Generar una migración nueva
npx sequelize-cli migration:generate --name nombre-descriptivo

# Generar un seeder nuevo
npx sequelize-cli seed:generate --name nombre-descriptivo

# Parar la base de datos
docker compose stop db
```

---

## Resumen en una sola tirada (caso normal, sin el truco de `--to`)

```bash
docker compose up -d --wait db
npm install
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
npm run dev-start
```

---

## URLs al final

| URL | Qué es |
|---|---|
| `http://localhost:3000/admin` | Panel AdminJS (login: `admin@barexpress.utn` / `admin_utn_pass_123`) |
| `http://localhost:3000/api/bebidas` | API REST en JSON |
