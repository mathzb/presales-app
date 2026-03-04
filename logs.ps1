# Docker Logs Management Script for Windows

param(
    [Parameter(Position=0)]
    [ValidateSet('view', 'follow', 'tail', 'save', 'clear', 'nginx-access', 'nginx-error', 'help')]
    [string]$Action = 'follow',
    
    [Parameter(Position=1)]
    [int]$Lines = 100
)

$containerName = "product-calculator-prod"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

function Show-Help {
    Write-Host "Docker Logs Management Script" -ForegroundColor Cyan
    Write-Host "==============================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\logs.ps1 [action] [lines]" -ForegroundColor White
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Yellow
    Write-Host "  view          View last logs (default: 100 lines)" -ForegroundColor White
    Write-Host "  follow        Follow logs in real-time (default)" -ForegroundColor White
    Write-Host "  tail          Show last N lines (specify number)" -ForegroundColor White
    Write-Host "  save          Save logs to file" -ForegroundColor White
    Write-Host "  clear         Clear Docker logs (requires restart)" -ForegroundColor White
    Write-Host "  nginx-access  View Nginx access logs" -ForegroundColor White
    Write-Host "  nginx-error   View Nginx error logs" -ForegroundColor White
    Write-Host "  help          Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\logs.ps1 follow              # Follow logs in real-time" -ForegroundColor Gray
    Write-Host "  .\logs.ps1 view 500            # View last 500 lines" -ForegroundColor Gray
    Write-Host "  .\logs.ps1 tail 50             # Show last 50 lines" -ForegroundColor Gray
    Write-Host "  .\logs.ps1 save                # Save logs to file" -ForegroundColor Gray
    Write-Host "  .\logs.ps1 nginx-access        # View Nginx access logs" -ForegroundColor Gray
    Write-Host "  .\logs.ps1 nginx-error         # View Nginx error logs" -ForegroundColor Gray
    Write-Host ""
}

function Test-ContainerRunning {
    $container = docker ps --filter "name=$containerName" --format "{{.Names}}" 2>$null
    return $container -eq $containerName
}

function Get-ContainerLogs {
    param([string]$Options)
    docker logs $Options $containerName
}

switch ($Action) {
    'view' {
        Write-Host "[*] Viewing last $Lines log lines..." -ForegroundColor Cyan
        Get-ContainerLogs "--tail $Lines"
    }
    
    'follow' {
        Write-Host "[*] Following logs (Press Ctrl+C to stop)..." -ForegroundColor Cyan
        Write-Host "Container: $containerName" -ForegroundColor Gray
        Write-Host ""
        Get-ContainerLogs "-f"
    }
    
    'tail' {
        Write-Host "[*] Last $Lines log lines:" -ForegroundColor Cyan
        Get-ContainerLogs "--tail $Lines"
    }
    
    'save' {
        $logFile = "logs_${timestamp}.txt"
        Write-Host "[*] Saving logs to $logFile..." -ForegroundColor Cyan
        Get-ContainerLogs "--timestamps" | Out-File -FilePath $logFile -Encoding UTF8
        Write-Host "[OK] Logs saved to: $logFile" -ForegroundColor Green
        Write-Host "File size: $((Get-Item $logFile).Length / 1KB) KB" -ForegroundColor Gray
    }
    
    'clear' {
        Write-Host "[!] Clearing Docker logs..." -ForegroundColor Yellow
        Write-Host "This will restart the container. Continue? (Y/N): " -NoNewline
        $confirm = Read-Host
        if ($confirm -eq 'Y' -or $confirm -eq 'y') {
            docker-compose restart web
            Write-Host "[OK] Container restarted, logs cleared" -ForegroundColor Green
        } else {
            Write-Host "[X] Operation cancelled" -ForegroundColor Red
        }
    }
    
    'nginx-access' {
        if (Test-ContainerRunning) {
            Write-Host "[*] Nginx Access Logs:" -ForegroundColor Cyan
            Write-Host ""
            docker exec $containerName tail -n $Lines /var/log/nginx/access.log
        } else {
            Write-Host "[X] Container is not running" -ForegroundColor Red
        }
    }
    
    'nginx-error' {
        if (Test-ContainerRunning) {
            Write-Host "[!] Nginx Error Logs:" -ForegroundColor Yellow
            Write-Host ""
            docker exec $containerName tail -n $Lines /var/log/nginx/error.log
        } else {
            Write-Host "[X] Container is not running" -ForegroundColor Red
        }
    }
    
    'help' {
        Show-Help
    }
    
    default {
        Show-Help
    }
}
