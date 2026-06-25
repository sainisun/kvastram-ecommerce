$outputFile = "DESIGN_SYSTEM_AUDIT_REPORT.md"
$date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

"# Design System Audit Report`nGenerated: $date`n" | Out-File $outputFile -Encoding UTF8

"## Executive Summary`n(Generated later)`n" | Out-File $outputFile -Append -Encoding UTF8
"## 1. Typography Issues`n" | Out-File $outputFile -Append -Encoding UTF8

"### 1A - Hardcoded font sizes in TSX/CSS`n" | Out-File $outputFile -Append -Encoding UTF8
Get-ChildItem -Recurse -Filter "*.tsx" -Path "src" | Select-String -Pattern 'text-\[[\d]|font-size:\s*[\d]|text-xs|text-sm|text-base|text-lg|text-xl|text-2xl|text-3xl|text-4xl' | Where-Object { $_.Line -notmatch 'text-body-|text-display-|text-count-' } | ForEach-Object { "- $($_.Filename):$($_.LineNumber) `$($_.Line.Trim())`" } | Out-File $outputFile -Append -Encoding UTF8

"### 1B - Hardcoded font weights in TSX`n" | Out-File $outputFile -Append -Encoding UTF8
Get-ChildItem -Recurse -Filter "*.tsx" -Path "src" | Select-String -Pattern 'font-bold|font-semibold|font-medium|font-light|font-\[[\d]' | Where-Object { $_.Line -notmatch 'font-display|font-body|font-ui|font-label|font-heading' } | ForEach-Object { "- $($_.Filename):$($_.LineNumber) `$($_.Line.Trim())`" } | Out-File $outputFile -Append -Encoding UTF8

"### 1C - Hardcoded line-height in TSX`n" | Out-File $outputFile -Append -Encoding UTF8
Get-ChildItem -Recurse -Filter "*.tsx" -Path "src" | Select-String -Pattern 'leading-\[|leading-tight|leading-relaxed|leading-normal|leading-snug' | Where-Object { $_.Line -notmatch 'var\(--ds-' } | ForEach-Object { "- $($_.Filename):$($_.LineNumber) `$($_.Line.Trim())`" } | Out-File $outputFile -Append -Encoding UTF8

"### 1D - Legacy font classes still in CSS files`n" | Out-File $outputFile -Append -Encoding UTF8
Get-ChildItem -Recurse -Filter "*.css" -Path "src/styles" | Select-String -Pattern 'font-size:\s*[\d]|line-height:\s*[\d]' | Where-Object { $_.Line -notmatch 'var\(--ds-' } | ForEach-Object { "- $($_.Filename):$($_.LineNumber) `$($_.Line.Trim())`" } | Out-File $outputFile -Append -Encoding UTF8

"## 2. Color Issues`n" | Out-File $outputFile -Append -Encoding UTF8

"### 2A - Hardcoded hex values in TSX`n" | Out-File $outputFile -Append -Encoding UTF8
Get-ChildItem -Recurse -Filter "*.tsx" -Path "src" | Select-String -Pattern '#[0-9a-fA-F]{3,6}\b|rgb\(|rgba\(' | Where-Object { $_.Line -notmatch '\/\/' } | ForEach-Object { "- $($_.Filename):$($_.LineNumber) `$($_.Line.Trim())`" } | Out-File $outputFile -Append -Encoding UTF8

"### 2B - Hardcoded Tailwind color classes in TSX`n" | Out-File $outputFile -Append -Encoding UTF8
Get-ChildItem -Recurse -Filter "*.tsx" -Path "src" | Select-String -Pattern 'text-gray-|text-slate-|text-zinc-|text-white|text-black|bg-white|bg-black|bg-gray-|bg-slate-|border-gray-|border-slate-' | Where-Object { $_.Line -notmatch 'var\(--ds-' } | ForEach-Object { "- $($_.Filename):$($_.LineNumber) `$($_.Line.Trim())`" } | Out-File $outputFile -Append -Encoding UTF8

"### 2C - Legacy color aliases still in TSX`n" | Out-File $outputFile -Append -Encoding UTF8
Get-ChildItem -Recurse -Filter "*.tsx" -Path "src" | Select-String -Pattern 'text-brand-|bg-brand-|border-brand-|text-ink|text-cream|text-muted(?!-)' | ForEach-Object { "- $($_.Filename):$($_.LineNumber) `$($_.Line.Trim())`" } | Out-File $outputFile -Append -Encoding UTF8

"### 2D - Hardcoded hex in CSS files (outside tokens.css)`n" | Out-File $outputFile -Append -Encoding UTF8
Get-ChildItem -Recurse -Filter "*.css" -Path "src/styles" | Where-Object { $_.Name -ne "tokens.css" } | Select-String -Pattern '#[0-9a-fA-F]{3,6}\b' | Where-Object { $_.Line -notmatch '\/\/' } | ForEach-Object { "- $($_.Filename):$($_.LineNumber) `$($_.Line.Trim())`" } | Out-File $outputFile -Append -Encoding UTF8

"## 3. Spacing Issues`n" | Out-File $outputFile -Append -Encoding UTF8

"### 3A - Hardcoded spacing values in TSX`n" | Out-File $outputFile -Append -Encoding UTF8
Get-ChildItem -Recurse -Filter "*.tsx" -Path "src" | Select-String -Pattern 'p-\[[\d]|m-\[[\d]|px-\[[\d]|py-\[[\d]|gap-\[[\d]|space-x-\[[\d]|space-y-\[[\d]' | Where-Object { $_.Line -notmatch 'var\(--ds-' } | ForEach-Object { "- $($_.Filename):$($_.LineNumber) `$($_.Line.Trim())`" } | Out-File $outputFile -Append -Encoding UTF8

"### 3B - Hardcoded padding/margin in CSS files`n" | Out-File $outputFile -Append -Encoding UTF8
Get-ChildItem -Recurse -Filter "*.css" -Path "src/styles" | Select-String -Pattern 'padding:\s*[\d]|margin:\s*[\d]|gap:\s*[\d]' | Where-Object { $_.Line -notmatch 'var\(--ds-' } | ForEach-Object { "- $($_.Filename):$($_.LineNumber) `$($_.Line.Trim())`" } | Out-File $outputFile -Append -Encoding UTF8

"### 3C - Raw Tailwind spacing not token-driven (Top 50)`n" | Out-File $outputFile -Append -Encoding UTF8
Get-ChildItem -Recurse -Filter "*.tsx" -Path "src" | Select-String -Pattern '\bp-[0-9]+\b|\bm-[0-9]+\b|\bpx-[0-9]+\b|\bpy-[0-9]+\b|\bpt-[0-9]+\b|\bpb-[0-9]+\b|\bmt-[0-9]+\b|\bmb-[0-9]+\b|\bgap-[0-9]+\b' | Where-Object { $_.Line -notmatch 'var\(--ds-' } | Select-Object -First 50 | ForEach-Object { "- $($_.Filename):$($_.LineNumber) `$($_.Line.Trim())`" } | Out-File $outputFile -Append -Encoding UTF8

"## 4. Component Issues`n" | Out-File $outputFile -Append -Encoding UTF8

"### 4A - Inline z-index values`n" | Out-File $outputFile -Append -Encoding UTF8
Get-ChildItem -Recurse -Filter "*.tsx" -Path "src" | Select-String -Pattern 'z-\[[\d]|z-index:\s*[\d]|z-10|z-20|z-30|z-40|z-50' | Where-Object { $_.Line -notmatch 'var\(--ds-z-' } | ForEach-Object { "- $($_.Filename):$($_.LineNumber) `$($_.Line.Trim())`" } | Out-File $outputFile -Append -Encoding UTF8

"### 4B - Hardcoded border-radius values`n" | Out-File $outputFile -Append -Encoding UTF8
Get-ChildItem -Recurse -Filter "*.tsx" -Path "src" | Select-String -Pattern 'rounded-\[[\d]|border-radius:\s*[\d]' | Where-Object { $_.Line -notmatch 'var\(--ds-radius-' } | ForEach-Object { "- $($_.Filename):$($_.LineNumber) `$($_.Line.Trim())`" } | Out-File $outputFile -Append -Encoding UTF8

"### 4C - Hardcoded transition values`n" | Out-File $outputFile -Append -Encoding UTF8
Get-ChildItem -Recurse -Filter "*.tsx" -Path "src" | Select-String -Pattern 'duration-\[[\d]|transition-\[|ease-\[' | Where-Object { $_.Line -notmatch 'var\(--ds-transition)' } | ForEach-Object { "- $($_.Filename):$($_.LineNumber) `$($_.Line.Trim())`" } | Out-File $outputFile -Append -Encoding UTF8

"### 4D - Multiple button styles check`n" | Out-File $outputFile -Append -Encoding UTF8
Get-ChildItem -Recurse -Filter "*.tsx" -Path "src" | Select-String -Pattern 'className.*button|className.*btn' | ForEach-Object { "- $($_.Filename):$($_.LineNumber) `$($_.Line.Trim())`" } | Out-File $outputFile -Append -Encoding UTF8

"## 5. Token Coverage`n" | Out-File $outputFile -Append -Encoding UTF8

"### 5A - Components NOT using any --ds-* tokens`n" | Out-File $outputFile -Append -Encoding UTF8
$files = Get-ChildItem -Recurse -Filter "*.tsx" -Path "src/components"
foreach ($file in $files) {
  $content = Get-Content $file.FullName -Raw
  $hasTokens = $content -match 'var\(--ds-'
  $hasTailwind = $content -match 'className'
  if ($hasTailwind -and -not $hasTokens) {
    "- $($file.Name)" | Out-File $outputFile -Append -Encoding UTF8
  }
}

"### 5B - CSS files with most hardcoded values (top offenders)`n" | Out-File $outputFile -Append -Encoding UTF8
$cssFiles = Get-ChildItem -Recurse -Filter "*.css" -Path "src/styles" | Where-Object { $_.Name -ne "tokens.css" }
foreach ($file in $cssFiles) {
  $hardcoded = Get-Content $file.FullName | Select-String -Pattern '[\d]+px|#[0-9a-fA-F]{3,6}' | Where-Object { $_ -notmatch 'var\(--ds-' }
  if ($hardcoded.Count -gt 0) {
    "=== $($file.Name): $($hardcoded.Count) hardcoded values ===" | Out-File $outputFile -Append -Encoding UTF8
    $hardcoded | Select-Object -First 5 | ForEach-Object { "  $($_.Line.Trim())" } | Out-File $outputFile -Append -Encoding UTF8
  }
}

"### 5C - tokens.css tokens that are NEVER used anywhere`n" | Out-File $outputFile -Append -Encoding UTF8
$tokens = Get-Content "src/styles/tokens.css" | Select-String -Pattern '--ds-[\w-]+' -AllMatches | ForEach-Object { $_.Matches } | ForEach-Object { $_.Value } | Select-Object -Unique
foreach ($token in $tokens) {
  $usage = Get-ChildItem -Recurse -Include "*.tsx","*.css" -Path "src" | Select-String -Pattern [regex]::Escape($token) | Where-Object { $_.Filename -ne "tokens.css" }
  if (-not $usage) {
    "- $token" | Out-File $outputFile -Append -Encoding UTF8
  }
}

"## 6. Consistency Issues`n" | Out-File $outputFile -Append -Encoding UTF8

"### 6A - Multiple files defining same CSS class (duplicates)`n" | Out-File $outputFile -Append -Encoding UTF8
Get-ChildItem -Recurse -Filter "*.css" -Path "src/styles" | Select-String -Pattern '^\.' | Group-Object { $_.Line.Trim() } | Where-Object { $_.Count -gt 1 } | ForEach-Object { "- $($_.Name) ($($_.Count) occurrences)" } | Out-File $outputFile -Append -Encoding UTF8

"### 6B - !important usage`n" | Out-File $outputFile -Append -Encoding UTF8
Get-ChildItem -Recurse -Include "*.css","*.tsx" -Path "src" | Select-String -Pattern '!important' | ForEach-Object { "- $($_.Filename):$($_.LineNumber) `$($_.Line.Trim())`" } | Out-File $outputFile -Append -Encoding UTF8

"### 6C - Inline style usage in TSX (bypasses design system)`n" | Out-File $outputFile -Append -Encoding UTF8
Get-ChildItem -Recurse -Filter "*.tsx" -Path "src" | Select-String -Pattern 'style=\{\{' | ForEach-Object { "- $($_.Filename):$($_.LineNumber) `$($_.Line.Trim())`" } | Out-File $outputFile -Append -Encoding UTF8

