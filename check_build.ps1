$apiKey = 'rnd_ceo1iE2mRVhXOGBhDGDNwBODNg5A'
$headers = @{
    'Authorization' = "Bearer $apiKey"
    'Accept' = 'application/json'
}
$serviceId = 'srv-dbbi36nf3r2c738vjngg'
$deployId = 'dep-dbi7iu4s728c73a5ado0'

$deploy = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/deploys/$deployId" -Headers $headers -Method Get
Write-Output "Status: $($deploy.status)"
Write-Output "UpdatedAt: $($deploy.updatedAt)"
Write-Output "FinishedAt: $($deploy.finishedAt)"
