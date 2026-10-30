$apiKey = 'rnd_ceo1iE2mRVhXOGBhDGDNwBODNg5A'
$headers = @{
    'Authorization' = "Bearer $apiKey"
    'Accept' = 'application/json'
    'Content-Type' = 'application/json'
}
$response = Invoke-RestMethod -Uri 'https://api.render.com/v1/services?limit=20' -Headers $headers -Method Get
foreach ($item in $response) {
    Write-Output "Service: $($item.service.name) | ID: $($item.service.id) | Repo: $($item.service.repo) | Type: $($item.service.type)"
}
