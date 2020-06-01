<#
.synopsis 
  Simple Powershell Script to run transactions against the Tada API Server

.Notes
  Author: cj
#>


PARAM (
  [String] $Address = '192.168.1.113',
  [String] $Port = '29809',
  [String] $ExecutionCommand
)

# Check Pester Version
# $pesterVersion = (Get-Module Pester).version
# if (($pesterVersion.Major -eq 4 -and $pesterVersion.Minor -lt 9) -or $pesterVersion.Major -lt 4) {
#   Write-error "test-qer.ps1 requires a minimum of Pester v4.9.0. Run as admin: 'Install-Module -Name Pester -Force -SkipPublisherCheck'"
# }

# if ($ExecutionCommand) {
#   Write-host "Execution command was provided. Local instance of app will be tested and launched with that."

# }

$base = "http://$Address`:$port"

$header1 = @{
  "API-Passcode" = "secretSquirrel"
}

$header2 = @{
  "API-Passcode" = "othersecret"
}

function get-jsDate {
  return [Math]::Floor(1000 * (Get-Date ([datetime]::UtcNow) -UFormat %s))
}

# Describe 'Simple' {
#   It "Qer welcome message on /api is present" {
#     $res = Invoke-WebRequest -UseBasicParsing -method GET -Uri "$base/api"
#     $res.content | Should -BeExactly "Welcome to Qer, the simple HTTP based queue service"
#     $res.StatusCode | Should -BeExactly 200
#   }

#   $_channel = "testChannel_$( get-jsDate )"
#   $_uri = "$base/api/$_channel"
#   $b = "{`"foo`": `"bar`"}"

#   It "Channel creation provides expected response" {
#     Write-Host "POSTing to $_uri with $b"
        
#     $res = Invoke-WebRequest -UseBasicParsing -method POST -Uri $_uri -Body $b  -ContentType "application/json"
#     $res.content | Should -BeExactly $stdResponses["POST_201Created"]
#     $res.StatusCode | Should -BeExactly 201
#   }

# }

# $uri = "$base/api/deleteeverything"
# write-host -ForegroundColor cyan -Object "GET $uri"
# $res = Invoke-WebRequest -Method GET -Uri "$uri"
# write-host $res

$uri = "$base/api/user/asdlfkjasldkfj/guild/1231231213"
write-host -ForegroundColor cyan -Object "POST $uri"
$res = Invoke-WebRequest -Method POST -Uri "$uri"
write-host $res

write-host -ForegroundColor cyan -Object "GET $uri"
$res = Invoke-WebRequest -Method GET -Uri "$uri"
write-host $res

