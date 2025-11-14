#!/bin/bash

# Script para hacer push usando token de GitHub
# Uso: ./push-with-token.sh TU_TOKEN_AQUI

if [ -z "$1" ]; then
    echo "Error: Debes proporcionar tu token de GitHub"
    echo "Uso: ./push-with-token.sh TU_TOKEN"
    exit 1
fi

TOKEN=$1

# Actualizar la URL del remoto con el token
git remote set-url origin https://${TOKEN}@github.com/maornelas/deportivo-frontend-admin.git

# Hacer push
git push -u origin main

echo "¡Código subido exitosamente!"

