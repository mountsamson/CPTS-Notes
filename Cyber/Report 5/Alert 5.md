# 🔍 Alert Investigation Report

> **Platform:** SOC Simulation Project — WDLabs  
> **Environment:** Microsoft Defender for Endpoint / Microsoft Sentinel

---

## 📋 Case Details

| Field                 | Value                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Alert Name**        | ## WDigest configuration change                                                                                         |
| **Alert ID / Link**   | https://security.microsoft.com/alerts/da12ff5b6e-e4f8-4443-8bd8-9c6d550e1f92_1?tid=567ea528-4e82-40fa-914e-38c05fd69677 |
| **Analyst**           | Carl Samson                                                                                                             |
| **Date Investigated** | 22/09/26                                                                                                                |
| **Severity**          | Low                                                                                                                     |

---

## 1. Alert Summary

- **Host / Account affected:** socsim-srv01 / Administrator
- **Date & Time of alert:** 25/8/2026 20:50:29
- **What triggered the alert:**  WDigest changes runned by powershell commands
- **Why it triggered (rule/logic):** Behaviour alerts 

---

## 2. Investigation Findings

### What happened?
<!-- How was the activity executed or triggered? Walk through the technical detail. -->

The activity started with an elevated `cmd.exe` process (PID 2872) at 20:50:26, which spawned `powershell.exe` a second later. That first PowerShell process (PID 468) was launched with `-NoProfile -NonInteractive -ExecutionPolicy Unrestricted -EncodedCommand`, passing its actual instructions as a base64 blob rather than plain text on the command line. Decoding that blob (base64 to UTF-16LE, which is how PowerShell always encodes `-EncodedCommand` payloads) shows it wasn't the real action at all, it was PowerShell calling itself again with a second, nested `-EncodedCommand`, which is what spawned the child process PID 4196.

Decoding that second, inner blob is where the actual executed code shows up: a script that sets the console's input/output encoding to UTF-8, checks that the PowerShell version is at least 3.0, reads a payload piped in over stdin, splits that payload on a four-null-character delimiter into a script block and a JSON argument block, then runs the script block with `[ScriptBlock]::Create(...)`. That exact script is the standard Ansible Windows/WinRM "exec wrapper", the mechanism Ansible's `win_*` modules use to push and execute code on a remote Windows host over WinRM. So the trigger for this whole chain wasn't a person typing commands interactively; it was remote command execution delivered through Ansible automation, running under the `SOCSIM-SRV01\Administrator` account with high integrity but standard (non-elevated-token) execution.

Two seconds after that wrapper ran, the same PowerShell process (PID 4196) made the one change that actually fired the alert: it wrote to `HKLM\SYSTEM\ControlSet001\Control\SecurityProviders\WDigest`, setting the value `UseLogonCredential` from empty to `1`. That registry write is what the alert is built around — the double-encoded PowerShell and the Ansible wrapper were just the delivery path that got a script running on the box; the WDigest change is the actual technique being executed, and it's what forces Windows to start caching the next logon's password in plaintext in LSASS memory instead of only a hashed form.

![[Pasted image 20260922103141.png]]

### Evidence
<!-- What artefacts, log entries, or indicators support your conclusion? -->

```
// Paste key log entries, process trees, or notable findings here
```

Decoded powershell command
![[Pasted image 20260922102834.png]]

Process tree timline

![[Pasted image 20260922102945.png]]

KQL commands on finding other commands running outside the alert timeline
![[Pasted image 20260922101141.png]]


![[Pasted image 20260922101659.png]]



### Was the activity successful?
- [ ] Yes
- [ ] No
- [x] Unknown

### Verdict
- [ ] **Malicious**
- [ ] **Non-malicious**
- [x] **Suspicious — requires further investigation**

**Justification:**
<!-- Why did you reach this conclusion? Be specific. -->

  This registry change is a credential-theft staging step . It comes from three specific things in the log. First, the exact key and value touched, `WDigest\UseLogonCredential` set to `1`, is a well-documented Windows setting whose sole function is controlling whether WDigest caches plaintext credentials in LSASS; there's no other legitimate reason on a modern server to enable it, since WDigest itself is a legacy protocol Windows keeps only for backward compatibility. Second, the value changed from `<empty>` (unset, i.e. disabled by default on current Windows versions) to `1`, which is the specific direction that turns plaintext caching on rather than off — a change from `1` back to empty would read as remediation, not staging. Third, the process making the change, PID 4196, is the same PowerShell process that had just run a decoded, non-interactive script (the Ansible exec-wrapper) rather than a user manually opening Group Policy or the registry editor, meaning this was pushed automatically as part of a scripted sequence rather than a routine admin task. On the MITRE ATT&CK framework, it is an example of credential dumpingL LSASS Memory  under modify regitry.



## 3. Investigation Steps

<!-- Walk through your process in order. What did you look at first? What led you to each pivot? -->

1. Looked the process logs and alert logs
2. reearched about WDigest configuration change on google and Gemmni 
3.  KQL commands
4. MITTRE ATTACK research 

### Queries Used

```kql
// Paste queries here

DeviceProcessEvents
| where DeviceName has "SOCSIM-SRV01"
| where InitiatingProcessId == 4196
| project Timestamp, FileName, ProcessCommandLine, InitiatingProcessFileName, AccountName
| sort by Timestamp asc


  
DeviceRegistryEvents | where DeviceName has "SOCSIM-SRV01" | where Timestamp between (datetime(2026-08-25T20:40:29Z) .. datetime(2026-08-25T21:00:29Z)) | project Timestamp, ActionType, RegistryKey, RegistryValueName, RegistryValueData, InitiatingProcessFileName | sort by Timestamp asc



```

---

## 4. Categorisation

- [ ] ✅ **True Positive** — malicious activity confirmed
- [x] ⚠️ **Benign True Positive** — alert fired correctly, activity is legitimate
- [ ] ❌ **False Positive** — alert fired incorrectly, rule needs review

---

## 5. Recommended Actions

**Escalation:**
- [ ] Urgent — phone call required
- [x] Non-urgent — email sufficient
- [ ] No escalation required

**Containment / Next Steps:**
<!-- What should happen next? Free text — don't limit yourself to a checklist. -->

- Revert the registry change of `UseLogonCredential` back to `0` to encryot all password logins.
- Capture a memory image of LSASS before rebooting
- Isolate the host from the network for further investigation
- Forced a password reset on any accounts logged on to` SOCSIM-SRV01`
- Restricting the registry key itself -  Set explicit ACLs (permissions) on `HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest` so that only SYSTEM and a admins can change these registry by using GPO-enforced  rule to`Disabled`

**Alert Tuning:**
- [ ] Tune recommended —
- [x] No tuning required

---

## 6. Lessons Learned

<!-- What would you do differently? Where did you go wrong or take a longer path than needed?
     This is the most valuable part of the write-up for your own growth and for anyone reading your portfolio. -->
 
 - Outside the alert, we have no real evidence of what happened, so sometimes calling in other experts and opinions to expand the analysis would be well.
 - An extra few days of analysis may make it better. 
 - Further investigations could've been done. 
 - Windows Defender decodes base64 akready so no need for 3rd party tools to decode it anymore.

---

<details>
<summary>📚 About this template</summary>

This investigation template is from the **[SOC Simulation Project](https://www.skool.com/socsim/about)** by WDLabs / WebDefend Cyber Security — a hands-on training environment giving aspiring analysts access to Microsoft Defender for Endpoint and Microsoft Sentinel to investigate real alerts generated by emulated threat actor TTPs.

</details>
