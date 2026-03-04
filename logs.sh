#!/bin/bash
# Docker Logs Management Script for Linux/Mac

set -e

CONTAINER_NAME="product-calculator-prod"
ACTION="${1:-follow}"
LINES="${2:-100}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

show_help() {
    echo -e "${CYAN}Docker Logs Management Script${NC}"
    echo "=============================="
    echo ""
    echo "Usage: ./logs.sh [action] [lines]"
    echo ""
    echo "Actions:"
    echo "  view          View last logs (default: 100 lines)"
    echo "  follow        Follow logs in real-time (default)"
    echo "  tail          Show last N lines (specify number)"
    echo "  save          Save logs to file"
    echo "  clear         Clear Docker logs (requires restart)"
    echo "  nginx-access  View Nginx access logs"
    echo "  nginx-error   View Nginx error logs"
    echo ""
    echo "Examples:"
    echo "  ./logs.sh follow              # Follow logs in real-time"
    echo "  ./logs.sh view 500            # View last 500 lines"
    echo "  ./logs.sh tail 50             # Show last 50 lines"
    echo "  ./logs.sh save                # Save logs to file"
    echo "  ./logs.sh nginx-access        # View Nginx access logs"
    echo "  ./logs.sh nginx-error         # View Nginx error logs"
    echo ""
}

test_container_running() {
    docker ps --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"
}

case "$ACTION" in
    view)
        echo -e "${CYAN}📋 Viewing last $LINES log lines...${NC}"
        docker logs --tail "$LINES" "$CONTAINER_NAME"
        ;;
    
    follow)
        echo -e "${CYAN}👀 Following logs (Press Ctrl+C to stop)...${NC}"
        echo -e "${GRAY}Container: $CONTAINER_NAME${NC}"
        echo ""
        docker logs -f "$CONTAINER_NAME"
        ;;
    
    tail)
        echo -e "${CYAN}📋 Last $LINES log lines:${NC}"
        docker logs --tail "$LINES" "$CONTAINER_NAME"
        ;;
    
    save)
        LOG_FILE="logs_${TIMESTAMP}.txt"
        echo -e "${CYAN}💾 Saving logs to $LOG_FILE...${NC}"
        docker logs --timestamps "$CONTAINER_NAME" > "$LOG_FILE"
        FILE_SIZE=$(du -h "$LOG_FILE" | cut -f1)
        echo -e "${GREEN}✅ Logs saved to: $LOG_FILE${NC}"
        echo -e "${GRAY}📊 File size: $FILE_SIZE${NC}"
        ;;
    
    clear)
        echo -e "${YELLOW}🗑️  Clearing Docker logs...${NC}"
        echo -n "This will restart the container. Continue? (y/N): "
        read -r confirm
        if [[ "$confirm" =~ ^[Yy]$ ]]; then
            docker-compose restart web
            echo -e "${GREEN}✅ Container restarted, logs cleared${NC}"
        else
            echo -e "${RED}❌ Operation cancelled${NC}"
        fi
        ;;
    
    nginx-access)
        if test_container_running; then
            echo -e "${CYAN}📊 Nginx Access Logs:${NC}"
            echo ""
            docker exec "$CONTAINER_NAME" tail -n "$LINES" /var/log/nginx/access.log
        else
            echo -e "${RED}❌ Container is not running${NC}"
            exit 1
        fi
        ;;
    
    nginx-error)
        if test_container_running; then
            echo -e "${YELLOW}⚠️  Nginx Error Logs:${NC}"
            echo ""
            docker exec "$CONTAINER_NAME" tail -n "$LINES" /var/log/nginx/error.log
        else
            echo -e "${RED}❌ Container is not running${NC}"
            exit 1
        fi
        ;;
    
    help|--help|-h)
        show_help
        ;;
    
    *)
        echo -e "${RED}Unknown action: $ACTION${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
