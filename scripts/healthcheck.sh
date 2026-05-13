#!/bin/bash
# ReleaseHub Healthcheck
C_RED='\033[0;31m'
C_GREEN='\033[0;32m'
C_YELLOW='\033[1;33m'
NC='\033[0m'
E=0
check_cmd() {
    if command -v $1 &> /dev/null; then
        echo -ne "  - $1: ${C_GREEN}OK${NC}"
        if [ "$1" == "gh" ]; then
            if gh auth status &>/dev/null; then echo -e " (Auth: ${C_GREEN}YES${NC})";
            else echo -e " (Auth: ${C_YELLOW}NO${NC})"; fi
        else echo -e ""; fi
    else echo -e "  - $1: ${C_YELLOW}MISSING${NC}"; fi
}
NV=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ -n "$NV" ] && [ "$NV" -ge 22 ]; then echo -e "  - Node: ${C_GREEN}OK${NC} ($NV)"
else echo -e "  - Node: ${C_RED}FAILED${NC} ($NV)"; E=1; fi
check_cmd git; check_cmd gh; check_cmd jq; check_cmd kubectl
if [[ "$*" == *"--deps"* ]] && [ ! -d "node_modules" ]; then echo -e "  - deps: ${C_RED}MISSING${NC}"; E=1; fi
if [[ "$*" == *"--build"* ]] && [ ! -d "dist" ]; then echo -e "  - build: ${C_RED}MISSING${NC}"; E=1; fi
[ $E -eq 0 ] && echo -e "✅ ${C_GREEN}OK${NC}" || echo -e "❌ ${C_RED}FAILED${NC}"
exit $E
