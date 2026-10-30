$apiKey = 'rnd_ceo1iE2mRVhXOGBhDGDNwBODNg5A'
$headers = @{
    'Authorization' = "Bearer $apiKey"
    'Accept' = 'application/json'
    'Content-Type' = 'application/json'
}
$serviceId = 'srv-dbbi36nf3r2c738vjngg'
$svc = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId" -Headers $headers -Method Get
Write-Output "Service Details:"
Write-Output "Name: $($svc.name)"
Write-Output "URL: $($svc.serviceDetails.url)"
Write-Output "Env: $($svc.serviceDetails.env)"

$deploys = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/deploys?limit=5" -Headers $headers -Method Get
Write-Output "`nRecent Deploys:"
foreach ($d in $deploys) {
    Write-Output "Deploy ID: $($d.deploy.id) | Status: $($d.deploy.status) | CreatedAt: $($d.deploy.createdAt) | Commit: $($d.deploy.commit.id)"
}
