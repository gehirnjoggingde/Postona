# Liest .env.local und fügt alle Variablen zu Vercel hinzu
Get-Content .env.local | ForEach-Object {
    # Kommentare und leere Zeilen überspringen
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }

    # KEY=VALUE aufteilen
    $parts = $_ -split '=', 2
    if ($parts.Length -ne 2) { return }

    $key = $parts[0].Trim()
    $value = $parts[1].Trim()

    Write-Host "Adding: $key"
    # Production + Preview + Development gleichzeitig setzen
    echo $value | npx vercel env add $key production --yes 2>$null
    echo $value | npx vercel env add $key preview --yes 2>$null
    echo $value | npx vercel env add $key development --yes 2>$null
}

Write-Host "Fertig!"
