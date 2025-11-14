# Instrucciones para subir el proyecto deportivo-frontend-admin a Git

## Paso 1: Inicializar el repositorio Git

```bash
cd /Users/maornelas/Code/deportivo/deportivo-frontend-admin
git init
```

## Paso 2: Verificar el archivo .gitignore

Asegúrate de que el archivo `.gitignore` incluya los siguientes elementos (ya debería estar configurado):

- `node_modules/`
- `dist/`
- `.env`
- `.DS_Store`
- Archivos de build y logs

## Paso 3: Agregar todos los archivos al staging

```bash
git add .
```

## Paso 4: Hacer el primer commit

```bash
git commit -m "Initial commit: Admin dashboard for Deportivo"
```

## Paso 5: Crear un repositorio en GitHub/GitLab/Bitbucket

1. Ve a tu plataforma Git preferida (GitHub, GitLab, Bitbucket, etc.)
2. Crea un nuevo repositorio (por ejemplo: `deportivo-frontend-admin`)
3. **NO** inicialices el repositorio con README, .gitignore o licencia (ya tenemos estos archivos)

## Paso 6: Conectar el repositorio local con el remoto

### Si usas GitHub:
```bash
git remote add origin https://github.com/TU_USUARIO/deportivo-frontend-admin.git
```

### Si usas GitLab:
```bash
git remote add origin https://gitlab.com/TU_USUARIO/deportivo-frontend-admin.git
```

### Si usas Bitbucket:
```bash
git remote add origin https://bitbucket.org/TU_USUARIO/deportivo-frontend-admin.git
```

**Nota:** Reemplaza `TU_USUARIO` con tu nombre de usuario real.

## Paso 7: Verificar la rama principal

```bash
git branch -M main
```

## Paso 8: Subir el código al repositorio remoto

```bash
git push -u origin main
```

## Comandos adicionales útiles

### Ver el estado del repositorio:
```bash
git status
```

### Ver los archivos que se van a subir:
```bash
git status --short
```

### Ver el historial de commits:
```bash
git log --oneline
```

### Si necesitas actualizar el repositorio después de hacer cambios:
```bash
git add .
git commit -m "Descripción de los cambios"
git push
```

### Si necesitas cambiar la URL del repositorio remoto:
```bash
git remote set-url origin NUEVA_URL
```

## Estructura del proyecto

El proyecto incluye:
- React + TypeScript
- Material UI
- Vite como build tool
- Dashboard administrativo con gráficas
- Gestión de productos, clientes, usuarios, facturas
- Sistema de autenticación

## Notas importantes

1. **Nunca subas archivos sensibles** como:
   - `.env` con credenciales
   - API keys
   - Tokens de acceso

2. **El archivo `.gitignore`** ya está configurado para excluir:
   - `node_modules/`
   - Archivos de build
   - Archivos del sistema operativo

3. Si trabajas en equipo, asegúrate de:
   - Hacer pull antes de push: `git pull origin main`
   - Resolver conflictos si los hay
   - Hacer commits descriptivos

