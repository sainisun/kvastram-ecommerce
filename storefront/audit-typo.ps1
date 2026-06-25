Write-Host "=== STEP 1 ==="
Get-Content src/styles/tokens.css | Select-String -Pattern "ds-text-|ds-type-|ds-leading-|ds-font-"

Write-Host "`n=== STEP 2 ==="
Get-ChildItem -Recurse -Include "*.tsx" src/components/ |
  ForEach-Object {
    $hits = Get-Content $_.FullName |
      Select-String -Pattern "text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)" |
      Where-Object { $_.Line -notmatch "text-\[var\(--ds-" }
    if ($hits) {
      Write-Host "=== $($_.Name) ==="
      $hits | Select-Object LineNumber, Line
    }
  }

Write-Host "`n=== STEP 3 ==="
Get-ChildItem -Recurse -Include "*.tsx" src/ |
  ForEach-Object {
    $hits = Get-Content $_.FullName |
      Select-String -Pattern "<h[1-6]|className=.*text-"
    if ($hits) {
      Write-Host "=== $($_.Name) ==="
      $hits | Select-Object LineNumber, Line
    }
  }

Write-Host "`n=== STEP 4 ==="
Get-Content src/styles/typography.css
