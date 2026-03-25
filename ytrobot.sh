#!/bin/bash

PROJECT_DIR="/Users/huseyincoskun/Downloads/Antigravity Proje/YTRobot"
PID_FILE="/tmp/ytrobot.pids"
LOG_DIR="$PROJECT_DIR/logs"
NVM_NODE="/Users/huseyincoskun/.nvm/versions/node/v24.14.0/bin"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

is_running() {
  [ -f "$PID_FILE" ] && kill -0 $(awk '{print $1}' "$PID_FILE") 2>/dev/null
}

start_servers() {
  mkdir -p "$LOG_DIR"
  echo -e "${CYAN}▶ YTRobot sunucuları başlatılıyor...${NC}"

  # FastAPI
  cd "$PROJECT_DIR"
  "$PROJECT_DIR/.venv/bin/python" server.py > "$LOG_DIR/api.log" 2>&1 &
  API_PID=$!

  # Remotion Studio
  cd "$PROJECT_DIR/remotion"
  PATH="$NVM_NODE:$PATH" npm run studio > "$LOG_DIR/remotion.log" 2>&1 &
  REMOTION_PID=$!

  echo "$API_PID $REMOTION_PID" > "$PID_FILE"

  echo -e "  ${GREEN}✓${NC} API Server       → http://localhost:8080  (PID $API_PID)"
  echo -e "  ${GREEN}✓${NC} Remotion Studio  → http://localhost:3000  (PID $REMOTION_PID)"
  echo -e "${YELLOW}⏳ Uygulama başlıyor, tarayıcı açılıyor...${NC}"

  sleep 4
  open "http://localhost:8080"

  echo -e "${GREEN}✅ Hazır! Durdurmak için bu scripti tekrar çalıştırın.${NC}"
}

stop_servers() {
  read API_PID REMOTION_PID < "$PID_FILE"
  echo -e "${RED}■ Sunucular durduruluyor...${NC}"
  kill "$API_PID" "$REMOTION_PID" 2>/dev/null
  # Kill any remaining remotion/node processes on port 3000
  lsof -ti:3000 | xargs kill -9 2>/dev/null
  lsof -ti:8080 | xargs kill -9 2>/dev/null
  rm -f "$PID_FILE"
  echo -e "${GREEN}✅ Sunucular durduruldu.${NC}"
}

# --- Toggle ---
if is_running; then
  stop_servers
else
  start_servers
fi
