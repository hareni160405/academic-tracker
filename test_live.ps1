try {
    $health = Invoke-RestMethod -Uri 'https://academic-tracker-3-a3uu.onrender.com/api/health' -Method Get
    Write-Output "Health: $($health | ConvertTo-Json -Compress)"
} catch {
    Write-Output "Health Error: $_"
}

try {
    $manifest = Invoke-RestMethod -Uri 'https://academic-tracker-3-a3uu.onrender.com/manifest.webmanifest' -Method Get
    Write-Output "Manifest Name: $($manifest.name) | Theme Color: $($manifest.theme_color)"
} catch {
    Write-Output "Manifest Error: $_"
}

try {
    $web = Invoke-WebRequest -Uri 'https://academic-tracker-3-a3uu.onrender.com/' -Method Get
    Write-Output "Frontend StatusCode: $($web.StatusCode) | ContentLength: $($web.RawContentLength)"
} catch {
    Write-Output "Web Error: $_"
}
