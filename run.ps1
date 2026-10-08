# Automata-Based Tokenizer PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Automata-Based Tokenizer for LLMs (Production System)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Booting system on http://localhost:5000 ..." -ForegroundColor Green
Write-Host ""

Set-Location $PSScriptRoot
python backend\server.py
