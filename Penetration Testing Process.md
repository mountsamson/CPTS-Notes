

> HTB Academy's module structure follows the real-world pentest lifecycle. Modules are sequenced to build fundamentals first, then layer in offensive skills stage by stage.

## The Loop

`Pre-Engagement → Information Gathering → Vulnerability Assessment → Exploitation → Post-Exploitation → Lateral Movement → Proof-of-Concept → Post-Engagement`

Not strictly linear — after Vuln Assessment/Exploitation/Post-Exploitation/Lateral Movement you can loop back to earlier stages depending on what access/info you have.--

## 1. Pre-Engagement

Scope, rules of engagement, contracts, and info exchange with client before any technical work starts.

## 2. Information Gathering

Identify targets before attacking — sometimes all you're given is a domain or IP range.

**Foundational modules (Tier 0):**

- Learning Process — how to learn efficiently
- Linux Fundamentals
- Windows Fundamentals
- Introduction to Networking
- Introduction to Web Applications
- Web Requests
- JavaScript Deobfuscation
- Introduction to Active Directory
- Getting Started — first guided box walkthrough

**Enumeration modules:**

- Network Enumeration with Nmap (Tier I)
- Footprinting — service-level enumeration (Tier II)
- Information Gathering - Web Edition (Tier II)
- OSINT: Corporate Recon (Tier IV)

## 3. Vulnerability Assessment

Two parts: automated scanning for known CVEs + manual analysis/creative thinking for logic flaws.

Can lead to → Exploitation, Post-Exploitation, Lateral Movement, or back to Info Gathering.

**Modules:**

- Vulnerability Assessment (scoring systems, scanners)
- File Transfers — moving tools/data to/from targets
- Shells & Payloads
- Using the Metasploit Framework

## 4. Exploitation

Attacking the vulnerability found. Split into **Network** and **Web** tracks.

**Network/General:**

- Password Attacks
- Attacking Common Services
- Pivoting, Tunneling & Port Forwarding
- Active Directory Enumeration & Attacks

**Web Exploitation:**

- Using Web Proxies (Burp/ZAP)
- Attacking Web Applications with Ffuf
- Login Brute Forcing
- SQL Injection Fundamentals
- SQLMap Essentials
- Cross-Site Scripting (XSS)
- File Inclusion (LFI/RFI)
- Command Injections
- Web Attacks — HTTP Verb Tampering, IDOR, XXE
- Attacking Common Applications

## 5. Post-Exploitation

Privilege escalation once you have initial access ("Pillaging" = local info gathering first).

- Linux Privilege Escalation
- Windows Privilege Escalation

## 6. Lateral Movement

Moving from one compromised host to others in the network. Doesn't always require privesc first. (Covered across Getting Started, Linux/Windows Privesc modules — no dedicated module.)

## 7. Proof-of-Concept

Documenting/automating exploit steps so admins can reproduce & verify findings.

- Introduction to Python 3 — scripting/automation

## 8. Post-Engagement

Clean up all tools/shells left on target systems, reconcile notes with report, deliver documentation.

- Documentation & Reporting
- Attacking Enterprise Networks — big-picture view of full chains

---

## Key Takeaways

- Thorough info gathering > rushing to exploit — most time-based assessments are lost to poor recon, not lack of skill.
- Analytical thinking ("question everything") is built over time, not from a single module — compared to learning an instrument.
- Tier 0 modules = mandatory fundamentals before specializing.