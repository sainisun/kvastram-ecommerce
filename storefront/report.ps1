Write-Host "## STEP 1 — Current spacing tokens"
Get-Content src/styles/tokens.css | 
  Select-String -Pattern "space|gutter|gap|padding|margin" |
  Select-Object Line

Write-Host "## STEP 2 — Current usage across all files"
Get-ChildItem -Recurse -Include "*.tsx","*.css" -Path "src" |
  Select-String -Pattern "ds-space-|ds-home-gutter" |
  Select-Object Filename, Line |
  Group-Object Filename |
  Select-Object Name, Count |
  Sort-Object Count -Descending

Write-Host "## STEP 3 — Hardcoded spacing still present"
Get-ChildItem -Recurse -Filter "*.css" -Path "src/styles" |
  Where-Object { $_.Name -ne "tokens.css" } |
  Select-String -Pattern "padding:\s*\d|margin:\s*\d|gap:\s*\d" |
  Where-Object { $_ -notmatch "var\(--ds-" } |
  Select-Object Filename, LineNumber, Line |
  Select-Object -First 30
