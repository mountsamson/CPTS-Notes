

 Suspicious DPAPI activity means an unknown or unauthorized program is trying to use the Windows Data Protection API (DPAPI) to decrypt sensitive data like saved web passwords, session cookies, or Wi-Fi keys. [[1](https://www.microsoft.com/en-us/security/blog/2025/05/21/lumma-stealer-breaking-down-the-delivery-techniques-and-capabilities-of-a-prolific-infostealer/), [2](https://ogmini.github.io/2025/05/18/Audit-DPAPI-Activity.html)]



Proces Logs

| Time                     | Alert                                              | Severity | Status      | Detail                                                                                                                                                                 |
| ------------------------ | -------------------------------------------------- | -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 14–15 Jul 2026, 16:45:11 | Suspicious service launched                        | Medium   | Detected    | `CalderaAgent` service created via `services.exe`, running `nssm.exe` — a C2/agent framework indicator                                                                 |
| 15 Jul 2026, 16:45:11–15 | Active malware detected                            | Low      | Detected    | `Trojan:Win64/SandCat.RTS!MTB` in `C:\Users\Public\wusvc.exe`, running as SYSTEM, calling out to `http://172.31.2.203:8888` (group "red") — Caldera's own agent binary |
| 15 Jul 2026, 17:40:17    | Suspicious process executed PowerShell command     | Medium   | Detected    | `powershell.exe -ExecutionPolicy Bypass`                                                                                                                               |
| 15 Jul 2026, 17:40:17    | Suspicious DPAPI activity                          | High     | Detected    | `dpapi::cred /unprotect`, `dpapi::cache` — credential vault access                                                                                                     |
| 15 Jul 2026, 17:40:17    | Malicious credential theft tool execution detected | High     | Detected    | Mimikatz invocation (`privilege::debug dpapi::cred ...`)                                                                                                               |
| 15 Jul 2026, 17:40:25    | Mimikatz credential theft tool                     | High     | **Blocked** | Defender quarantined `HackTool:Win32/Mimikatz` in `kb97416.zip` before it could be written to disk                                                                     |

![[Pasted image 20260918144304.png]]
https://security.microsoft.com/v2/advanced-hunting?tid=567ea528-4e82-40fa-914e-38c05fd69677