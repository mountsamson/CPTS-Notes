
# Box Name

## Box Info

- **Difficulty**: Easy / Medium / Hard
- **OS**: Linux / Windows
- **Date Completed**: YYYY-MM-DD
- **IP Address**: 10.129.x.x

---

## Enumeration

### Nmap Scan

```bash
nmap -sC -sV -oA nmap/initial <IP>
```

**Results:**
- Port XX: Service  -  Version
- Port XX: Service  -  Version

### Web Enumeration

<!-- What did you find visiting the site? Tech stack, interesting pages, login portals, downloadable files? -->

### Service Enumeration

<!-- Any other services worth noting  -  SMB, FTP, SSH banners, etc. -->

---

## Source Code Analysis

<!-- If source code is available  -  always download it. Document key findings. -->
<!-- What files were interesting? What did you grep for? What logic is vulnerable? -->

---

## Exploitation  -  Initial Foothold

### The Plan

<!-- One paragraph explaining your attack path before you execute it. -->

### Vulnerability

**Type**: <!-- e.g. Path Traversal, RCE, SQLi, Backdoor -->
**Location**: <!-- File, endpoint, header, etc. -->
**Why it works**: <!-- Brief technical explanation -->

### Steps

1.
2.
3.

```bash
# Key commands here
```

**Result**: Shell as `user`

---

## Lateral Movement

<!-- If you needed to pivot between users before privesc -->

### From `user_a` to `user_b`

**Method**: <!-- Credential reuse, hash cracking, readable files, etc. -->

```bash
# Commands
```

**User flag**: `/home/<user>/user.txt`

---

## Privilege Escalation

### Enumeration

```bash
sudo -l
# Always run this first
```

<!-- What did you find? SUID binaries, writable crons, sudo entries, capabilities? -->

### Vulnerability

**Type**: <!-- e.g. Sudo misconfiguration, CVE, SUID binary, writable cron -->
**Why it works**: <!-- Technical explanation -->

### Exploit

```bash
# Commands
```

**Root flag**: `/root/root.txt`

---

## Rabbit Holes

<!-- What did you waste time on? What looked promising but wasn't? -->
<!-- This is where the real learning is. Don't skip it. -->

-

---

## Attack Chain Summary

```
Initial access vector
      ↓
How you got a shell
      ↓
Lateral movement (if any)
      ↓
Privesc method
      ↓
Root
```

---

## Key Learnings

<!-- What would you do differently? What new technique did you learn? -->
<!-- What will you remember for the next box? -->

-

---

## Commands Reference

```bash
# Enumeration


# Exploitation


# Privilege Escalation


# Flags
cat /home/<user>/user.txt
cat /root/root.txt
```

---

## Tags

#htb #easy #linux
