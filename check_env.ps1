$apiKey = 'rnd_ceo1iE2mRVhXOGBhDGDNwBODNg5A'
$headers = @{
    'Authorization' = "Bearer $apiKey"
    'Accept' = 'application/json'
}
$serviceId = 'srv-dbbi36nf3r2c738vjngg'
$envVars = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/env-vars" -Headers $headers -Method Get
Write-Output "Environment Variables:"
foreach ($e in $envVars) {
    Write-Output "Key: $($e.envVar.key) | Value: $($e.envVar.value)"
}
