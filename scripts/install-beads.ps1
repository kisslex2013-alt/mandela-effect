# Beads Installation Script
# Requires admin rights for Go installation

$ErrorActionPreference = 'Continue'

Write-Host "Checking Go..." -ForegroundColor Cyan

# Check if Go is installed
try {
    $goVersion = go version 2>&1
    if ($LASTEXITCODE -eq 0 -and $goVersion -notmatch "not found" -and $goVersion -notmatch "не является") {
        Write-Host "OK: Go is installed: $goVersion" -ForegroundColor Green
        $goInstalled = $true
    } else {
        $goInstalled = $false
    }
} catch {
    $goInstalled = $false
}

if (-not $goInstalled) {
    Write-Host "Go is NOT installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "INSTALLING GO (requires admin rights)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Manual installation (recommended):" -ForegroundColor Cyan
    Write-Host "1. Open: https://go.dev/dl/" -ForegroundColor White
    Write-Host "2. Download installer for Windows (.msi file)" -ForegroundColor White
    Write-Host "3. Run installer and follow instructions" -ForegroundColor White
    Write-Host "4. Restart terminal" -ForegroundColor White
    Write-Host "5. Run this script again: .\install-beads.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Automatic via Chocolatey:" -ForegroundColor Cyan
    Write-Host "(If you have Chocolatey installed)" -ForegroundColor Gray
    Write-Host "choco install golang -y" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Install Go automatically via Chocolatey? (y/n)"
    if ($choice -eq "y" -or $choice -eq "Y") {
        try {
            choco install golang -y
            if ($LASTEXITCODE -eq 0) {
                Write-Host "OK: Go installed! Restart terminal and run script again." -ForegroundColor Green
            } else {
                Write-Host "ERROR: Chocolatey installation failed. Use manual installation." -ForegroundColor Red
            }
        } catch {
            Write-Host "ERROR: Chocolatey not found. Use manual installation." -ForegroundColor Red
        }
    }
    
    exit 1
}

# If Go is installed, continue with Beads installation
Write-Host ""
Write-Host "Checking Beads..." -ForegroundColor Cyan

# Check if Beads is installed
try {
    $beadsVersion = bd --version 2>&1
    if ($LASTEXITCODE -eq 0 -and $beadsVersion -notmatch "not found" -and $beadsVersion -notmatch "не является") {
        Write-Host "OK: Beads is already installed: $beadsVersion" -ForegroundColor Green
        $beadsInstalled = $true
    } else {
        $beadsInstalled = $false
    }
} catch {
    $beadsInstalled = $false
}

if (-not $beadsInstalled) {
    Write-Host "Installing Beads..." -ForegroundColor Yellow
    Write-Host ""
    
    # Install Beads
    go install github.com/steveyegge/beads@latest
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Beads installed!" -ForegroundColor Green
        
        # Check if Beads is in PATH
        $goBinPath = "$env:USERPROFILE\go\bin"
        if ($env:PATH -notlike "*$goBinPath*") {
            Write-Host ""
            Write-Host "WARNING: Beads installed but not in PATH" -ForegroundColor Yellow
            Write-Host "Add to PATH: $goBinPath" -ForegroundColor White
            Write-Host ""
            Write-Host "Or add temporarily for this session:" -ForegroundColor Cyan
            Write-Host '$env:PATH += ";$env:USERPROFILE\go\bin"' -ForegroundColor White
            Write-Host ""
            
            # Add temporarily for current session
            $env:PATH += ";$goBinPath"
            Write-Host "OK: PATH updated for current session" -ForegroundColor Green
        }
    } else {
        Write-Host "ERROR: Beads installation failed" -ForegroundColor Red
        exit 1
    }
}

# Final check
Write-Host ""
Write-Host "Final check..." -ForegroundColor Cyan

try {
    $beadsVersion = bd --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Beads is working: $beadsVersion" -ForegroundColor Green
        
        # Initialize Beads in project
        Write-Host ""
        Write-Host "Initializing Beads in project..." -ForegroundColor Cyan
        
        $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
        Set-Location $scriptPath
        
        bd init --prefix ttm
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "OK: Beads initialized in project!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Cyan
            Write-Host "1. Use 'bd add' to add tasks" -ForegroundColor White
            Write-Host "2. Use 'bd list' to view tasks" -ForegroundColor White
            Write-Host "3. See SETUP-GUIDE.md for examples" -ForegroundColor White
        } else {
            Write-Host "WARNING: Beads was already initialized or error occurred" -ForegroundColor Yellow
        }
    } else {
        Write-Host "WARNING: Beads installed but not in PATH" -ForegroundColor Yellow
        Write-Host "Restart terminal or add to PATH: $env:USERPROFILE\go\bin" -ForegroundColor White
    }
} catch {
    Write-Host "WARNING: Beads installed but not accessible. Restart terminal." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
