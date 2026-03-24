# kill-ports.ps1
# This script forcefully terminates any processes listening on ports 3000, 3001, and 4000.
# Useful for cleaning up "zombie" node server processes.

$ports = @(3000, 3001, 4000)

Write-Host "Checking for processes holding ports 3000, 3001, 4000..."

foreach ($port in $ports) {
    # Find PIDs holding the port
    $pids = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess
    
    if ($pids) {
        $uniquePids = $pids | Select-Object -Unique
        foreach ($pid in $uniquePids) {
            Write-Host "Found process $pid listening on port $port. Terminating..."
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "Terminated process $pid."
        }
    } else {
        Write-Host "No process found on port $port."
    }
}

Write-Host "Port cleanup complete."
