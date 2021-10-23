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

# $uri = "$base/api/deleteeverything"
# write-host -ForegroundColor cyan -Object "GET $uri"
# $res = Invoke-WebRequest -Method GET -Uri "$uri"
# write-host $res

function webget ($method, $uri, $body) {
  write-host -ForegroundColor cyan -Object "$method $uri"
  $res = $null
  try {
    if ($body) {
      $res = Invoke-WebRequest -Method $method -Uri $uri -body $body -ErrorAction stop
    } else {
      $res = Invoke-WebRequest -Method $method -Uri $uri -ErrorAction stop
    }
  }
  catch {
    $res = $_.Exception.Response 
  }
  write-host $res.content
  return $res
}

BeforeAll {
  write-host -ForegroundColor RED "Removing test's user and guild setups"
  $uri = "$base/api/user/181615330861252608/guild/411102766929543178"
  $res = webget DELETE $uri

  $uri = "$base/api/guild/411102766929543178"
  $res = webget DELETE $uri

  $uri = "$base/api/intro"
  $res = webget POST $uri "{data: '192301923lkjlasdulkasjdlkasjd', filename: 'tada', id: 1}"

  $uri = "$base/api/guild/411102766929543178"
  $res = webget POST $uri "{}"

}

Describe 'New User joining a channel' {
  It "attempts to fetch a non-existent user from API" {
    $uri = "$base/api/user/181615330861252608/guild/411102766929543178"
    $res = webget GET $uri

    $res.StatusCode | Should -BeExactly 404
  }

  $introid = $null
  It "creates a new user for the person that joined the channel" {
    $uri = "$base/api/user/181615330861252608/guild/411102766929543178"
    $res = webget -Method POST -Uri "$uri"

    $res.content | Should -BeLike "{*}"
    $introid = $res.content | ConvertFrom-Json | Select-Object -Property introID

    $res.StatusCode | Should -BeExactly 201
  }

  It "fetches the user's intro" {
    $uri = "$base/api/intro/$introid"
    $res = webget -method GET -uri $uri

    $res.StatusCode | Should -BeExactly 200
  }
}

Describe 'Returning User joins a channel' {
  $introid = $null
  It "attempts to fetch an existing user from the API" {
    $uri = "$base/api/user/181615330861252608/guild/411102766929543178"
    $res = webget GET $uri

    $res.StatusCode | Should -BeExactly 200

    $introid = ($res.content | ConvertFrom-Json)[0].introid
  }

  It "fetches the user's intro" {
    $uri = "$base/api/intro/$introid"
    $res = webget GET $uri

    $res.StatusCode | Should -BeExactly 200
  }
}

Describe "User updating their intro" {
  $introid = $null
  It "Check that intro exists in guild" {
    $uri = "$base/api/guild/411102766929543178"
    $res = webget GET $uri

    $res.StatusCode | Should -BeExactly 200
  }

  $resdata = $null
  It "Retrieve the user's current guild data" {
    $uri = "$base/api/user/181615330861252608/guild/411102766929543178"
    $res = webget GET $uri
    $resdata = $res.content
    $res.StatusCode | Should -BeExactly 200
  }

  It "Update user's guild data to use the new introid" {
    $uri = "$base/api/user/181615330861252608/guild/411102766929543178"
    $userdata = ConvertFrom-Json $resdata
    $userdata.introid = $introid
    $body = ConvertTo-Json $userdata -Compress -Depth 10

    $res = webget PUT $uri $body

    $res.StatusCode | Should -BeExactly 200
  }
}
