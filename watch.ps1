$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = Split-Path -parent $PSCommandPath | Join-Path -ChildPath src/model
$action = { uglifyjs ./src/model/* -c -m --source-map url=model.js.map -o model.js }
Register-ObjectEvent $watcher Created -Action $action
Register-ObjectEvent $watcher Changed -Action $action
Register-ObjectEvent $watcher Deleted -Action $action
Register-ObjectEvent $watcher Renamed -Action $action

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = Split-Path -parent $PSCommandPath | Join-Path -ChildPath src/okex
$action = { uglifyjs ./src/okex/* -c -m --source-map url=okex.js.map -o okex.js }
Register-ObjectEvent $watcher Created -Action $action
Register-ObjectEvent $watcher Changed -Action $action
Register-ObjectEvent $watcher Deleted -Action $action
Register-ObjectEvent $watcher Renamed -Action $action
