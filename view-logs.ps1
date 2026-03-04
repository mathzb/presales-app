# Simple Docker Logs Viewer for Windows
# Usage: .\view-logs.ps1

param(
    [Parameter(Position=0)]
    [string]$Command = "follow",
    
    [Parameter(Position=1)]
    [int]$Lines = 100
)

$containerName = "product-calculator-prod"

Write-Host "Docker Logs Viewer" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host ""

switch ($Command.ToLower()) {
    "follow" {
        Write-Host "Following logs (Press Ctrl+C to stop)..." -ForegroundColor Green
        Write-Host ""
        docker logs -f $containerName
    }
    "view" {
        Write-Host "Viewing last $Lines lines..." -ForegroundColor Green
        Write-Host ""
        docker logs --tail $Lines $containerName
    }
    "save" {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $filename = "logs_$timestamp.txt"
        Write-Host "Saving logs to: $filename" -ForegroundColor Green
        docker logs $containerName > $filename
        Write-Host "Done! File saved." -ForegroundColor Green
    }
    "nginx" {
        Write-Host "Nginx Access Logs:" -ForegroundColor Green
        Write-Host ""
        docker exec $containerName tail -n $Lines /var/log/nginx/access.log
    }
    "errors" {
        Write-Host "Nginx Error Logs:" -ForegroundColor Yellow
        Write-Host ""
        docker exec $containerName tail -n $Lines /var/log/nginx/error.log
    }
    "status" {
        Write-Host "Container Status:" -ForegroundColor Green
        docker ps --filter "name=$containerName"
    }
    default {
        Write-Host "Available commands:" -ForegroundColor Yellow
        Write-Host "  .\view-logs.ps1 follow       - Follow logs in real-time"
        Write-Host "  .\view-logs.ps1 view [lines] - View last N lines (default: 100)"
        Write-Host "  .\view-logs.ps1 save         - Save logs to file"
        Write-Host "  .\view-logs.ps1 nginx        - View Nginx access logs"
        Write-Host "  .\view-logs.ps1 errors       - View Nginx error logs"
        Write-Host "  .\view-logs.ps1 status       - Check container status"
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor Gray
        Write-Host "  .\view-logs.ps1 follow"
        Write-Host "  .\view-logs.ps1 view 500"
        Write-Host "  .\view-logs.ps1 save"
    }
}
