AlertEvidence
| where AlertId == "da1712631f-3404-43b0-8e5f-9e7ce03198d6_1"

DeviceProcessEvents
| where DeviceName == "socsim-srv01.socsim.local"
| where Timestamp > datetime(2026-08-25T10:48:06Z)
| project Timestamp, AccountName, FileName, ProcessCommandLine,
 InitiatingProcessFileName, InitiatingProcessCommandLine
| sort by Timestamp asc

DeviceProcessEvents
| where Timestamp > datetime(2026-08-25T10:48:06Z)
| where FileName =~ "setspn.exe" or ProcessCommandLine has "setspn"
| project AccountName, FileName, ProcessCommandLine

DeviceProcessEvents
| where Timestamp > datetime(2026-08-25T10:48:06Z)
| where FileName =~ "setspn.exe" or ProcessCommandLine has "setspn"
| project AccountName, FileName, ProcessCommandLine, Timestamp

| where Timestamp > datetime(2026-08-25T10:48:06Z)
| where FileName =~ "setspn.exe" or ProcessCommandLine has "setspn"
| where DeviceName contains "SOCSIM-DC.socsim.locaL"
| project AccountName, FileName, ProcessCommandLine, Timestamp


`AlertEvidence`
`| where AlertId == "da1712631f-3404-43b0-8e5f-9e7ce03198d6_1"`
`| where isnotempty(ProcessCommandLine)`
`| project Timestamp, DeviceName, AccountName, ProcessCommandLine`

DeviceProcessEvents
| where Timestamp > datetime(2026-08-25T10:48:06Z)
| where FileName =~ "setspn.exe" or ProcessCommandLine has "setspn"
| distinct DeviceName, DeviceId

DeviceProcessEvents
| where Timestamp > datetime(2026-08-25T10:48:06Z)=
| where FileName =~ "setspn.exe" or ProcessCommandLine has "setspn"
| distinct DeviceName, DeviceId

DeviceFileEvents
| where Timestamp > datetime(2026-08-25T10:48:06Z)
| where FolderPath has "recon.txt" or FileName =~ "recon.txt"
| project Timestamp, DeviceName, ActionType, FolderPath, InitiatingProcessFileName, InitiatingProcessCommandLine

let SetspnDevices =
    DeviceProcessEvents
    | where Timestamp > datetime(2026-08-25T10:48:06Z)
    | where FileName =~ "setspn.exe" or ProcessCommandLine has "setspn"
    | distinct DeviceName;
DeviceNetworkInfo
| where DeviceName in (SetspnDevices)
| summarize arg_max(Timestamp, *) by DeviceName, MacAddress
| mv-expand parse_json(IPAddresses)
| extend IPAddress = tostring(IPAddresses.IPAddress)
| where IPAddress != "127.0.0.1" and IPAddress !startswith "fe80"
| project Timestamp, DeviceName, MacAddress, IPAddress, NetworkAdapterType,

let MyAlert = "da1712631f-3404-43b0-8e5f-9e7ce03198d6_1";
let MyAccounts =
    AlertEvidence
    | where AlertId == MyAlert
    | where isnotempty(AccountName)
    | distinct AccountName;
AlertEvidence
| where AccountName in (MyAccounts)
| where AlertId != MyAlert
| distinct AlertId, AccountName
| join kind=inner AlertInfo on AlertId
| project Timestamp, AlertId, Title, Severity, Category, AccountName
| sort by Timestamp asc