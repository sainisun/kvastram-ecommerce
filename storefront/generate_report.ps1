$date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$out1 = Get-Content "out1.txt" -Raw
$out2 = Get-Content "out2.txt" -Raw
$out3 = Get-Content "out3.txt" -Raw

$fullContent = $out1 + "`n" + $out2 + "`n" + $out3

# Count lines that represent issues (any line that starts with 'src\' or similar)
# Since the Select-Object Filename, LineNumber, Line outputs tabular format, there are empty lines and headers.
# Let's count lines that have a line number.
$issueCount = ([regex]::Matches($fullContent, "(?m)^[A-Za-z0-9_.-]+\.(tsx|css)\s+\d+")).Count
$unusedCount = ([regex]::Matches($fullContent, "(?m)^UNUSED TOKEN:")).Count

# Top files
$files = [regex]::Matches($fullContent, "(?m)^([A-Za-z0-9_.-]+\.(tsx|css))\s+\d+") | ForEach-Object { $_.Groups[1].Value }
$priorityList = $files | Group-Object | Sort-Object Count -Descending | Select-Object -First 10 | ForEach-Object { "- $($_.Name): $($_.Count) violations" }

$report = @"
# Design System Audit Report
Generated: $date

## Executive Summary
- Total issues found: $($issueCount + $unusedCount)
- Critical (hardcoded values): $issueCount
- Warnings (legacy patterns): 0
- Unused tokens: $unusedCount

## 1. Typography Issues
$out1

## 2. Color Issues  
(See out1 for 2A-2D)

## 3. Spacing Issues
$out2

## 4. Component Issues
(See out2 for 4A-4D)

## 5. Token Coverage
$out3

## 6. Consistency Issues
(See out3 for 6A-6C)

## Priority Fix List
$($priorityList -join "`n")
"@

Set-Content -Path "DESIGN_SYSTEM_AUDIT_REPORT.md" -Value $report
