#!/bin/bash
# Healthcheck CLI para ReleaseHub - Nexus 🌐
set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Verificando salud del entorno de ReleaseHub..."

# 1. Node.js (v22+)
NODE_V=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_V" -lt 22 ]; then
  echo -e "${RED}❌ Node.js 22+ requerido. Tienes v$(node -v)${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Node.js v$(node -v)${NC}"

# 2. GitHub CLI (gh)
if ! command -v gh &> /dev/null; then
  echo -e "${YELLOW}⚠️  GitHub CLI (gh) no detectado. Es necesario para operaciones remotas.${NC}"
else
  echo -e "${GREEN}✅ GitHub CLI detectado.${NC}"
fi

# 3. Dependencias
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}⚠️  node_modules no encontrado. Ejecuta 'npm install'.${NC}"
else
  echo -e "${GREEN}✅ Dependencias instaladas.${NC}"
fi

# 4. Build
if [ ! -d "dist" ]; then
  echo -e "${YELLOW}⚠️  Directorio 'dist' no encontrado. Ejecuta 'npm run build'.${NC}"
else
  echo -e "${GREEN}✅ Build listo.${NC}"
fi

echo -e "\n${GREEN}🚀 Sistema listo para desarrollo/ejecución.${NC}"
