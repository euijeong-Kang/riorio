$ErrorActionPreference = 'Stop'
$bin = 'C:\Program Files\PostgreSQL\17\bin'
$root = Join-Path ([System.IO.Path]::GetTempPath()) ('riorio-isolated-' + [guid]::NewGuid().ToString('N'))
$data = Join-Path $root 'data'
$passwordFile = Join-Path $root 'password.txt'
$log = Join-Path $root 'postgres.log'
$attemptedStart = $false
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 55439)
try {
  $listener.Start()
} finally {
  $listener.Stop()
}
New-Item -ItemType Directory -Path $root | Out-Null
$bytes = [byte[]]::new(32)
$random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try { $random.GetBytes($bytes) } finally { $random.Dispose() }
[System.IO.File]::WriteAllText($passwordFile, [Convert]::ToBase64String($bytes), [System.Text.Encoding]::ASCII)

function Assert-Success($action) {
  if ($LASTEXITCODE -ne 0) { throw "$action failed with exit code $LASTEXITCODE" }
}

function Invoke-LocalPgCtl($action, $arguments) {
  $process = Start-Process -FilePath "$bin\pg_ctl.exe" -ArgumentList $arguments -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $root "pgctl-$action.stdout") -RedirectStandardError (Join-Path $root "pgctl-$action.stderr")
  $null = $process.Handle
  if (-not $process.WaitForExit(30000)) { throw "pg_ctl $action timed out" }
  if ($process.ExitCode -ne 0) { throw "pg_ctl $action failed with exit code $($process.ExitCode)" }
}

try {
  & "$bin\initdb.exe" -D $data -U riorio_test --auth=scram-sha-256 "--pwfile=$passwordFile" --encoding=UTF8 --locale=C | Out-Null
  Assert-Success 'initdb'
  $attemptedStart = $true
  Invoke-LocalPgCtl 'start' @('-D', "`"$data`"", '-l', "`"$log`"", '-o', '"-h 127.0.0.1 -p 55439"', '-w', 'start')
  $env:PGPASSWORD = [System.IO.File]::ReadAllText($passwordFile)
  & "$bin\createdb.exe" -h 127.0.0.1 -p 55439 -U riorio_test riorio_reservation_fixture
  Assert-Success 'createdb'
  $argsForPsql = @('-X', '-h', '127.0.0.1', '-p', '55439', '-U', 'riorio_test', '-d', 'riorio_reservation_fixture', '-v', 'ON_ERROR_STOP=1', '-q')
  $fixtures = @('reservation-table-allocation.sql', 'reservation-cancellation.sql', 'reservation-transaction-policy.sql', 'reservation-recovery-transaction.sql', 'reservation-replay-auth.sql', 'reservation-price-change.sql', 'reservation-combined-transaction.sql', 'reservation-admin-audit.sql', 'reservation-admin-transfer.sql')
  foreach ($fixture in $fixtures) {
    & "$bin\psql.exe" @argsForPsql -f (Join-Path $PSScriptRoot "..\tests\fixtures\$fixture")
    Assert-Success $fixture
  }
  & "$bin\psql.exe" @argsForPsql -f (Join-Path $PSScriptRoot '..\tests\fixtures\christmas-deploy-test-setup.sql')
  Assert-Success 'christmas test setup'
  & "$bin\psql.exe" @argsForPsql -f (Join-Path $PSScriptRoot '..\supabase\migrations\202611230001_christmas_reservations.sql')
  Assert-Success 'christmas migration'
  & "$bin\psql.exe" @argsForPsql -f (Join-Path $PSScriptRoot '..\tests\fixtures\christmas-deploy-test.sql')
  Assert-Success 'christmas migration test'
  $env:RIORIO_LOCAL_TEST_PSQL = "$bin\psql.exe"
  $env:RIORIO_LOCAL_TEST_PGPASSWORD_FILE = $passwordFile
  $env:RIORIO_LOCAL_TEST_DATA_DIRECTORY = $data
  $testFiles = @('reservation-combined-db.integration.test.mjs', 'reservation-transfer-race.integration.test.mjs', 'reservation-admin-db.integration.test.mjs', 'reservation-consent-db.integration.test.mjs', 'reservation-deposit-race.integration.test.mjs', 'reservation-slot-race.integration.test.mjs') | ForEach-Object { Join-Path $PSScriptRoot "..\tests\$_" }
  & node --test --test-concurrency=1 @testFiles
  Assert-Success 'DB integration tests'
  Write-Output "Isolated fixture directory: $root"
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  if ($attemptedStart -and (Test-Path -LiteralPath (Join-Path $data 'postmaster.pid'))) {
    try { Invoke-LocalPgCtl 'stop' @('-D', "`"$data`"", '-m', 'fast', '-w', 'stop') } catch { Write-Warning "Unable to stop isolated fixture: $data" }
  }
  if (Test-Path -LiteralPath $passwordFile) { Remove-Item -LiteralPath $passwordFile -Force }
}
