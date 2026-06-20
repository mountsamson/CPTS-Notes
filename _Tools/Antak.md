# Antak Webshell

ASPX web shell from the [Nishang](https://github.com/samratashok/nishang) offensive PowerShell toolset. Runs on Windows hosts with ASP.NET — UI and interaction is PowerShell-style. Each command runs as a new process. Can execute scripts in memory and encode commands.

Built into Kali/Parrot at `/usr/share/nishang/Antak-WebShell/`.

---

## Workflow

```bash
# 1. Copy the file
cp /usr/share/nishang/Antak-WebShell/antak.aspx /home/administrator/Upload.aspx
```

```
# 2. Edit the file
#    Line 14 — set a username and password for the shell login prompt
#    Strip ASCII art and comments (AV/defender signatures)
```

```bash
# 3. Upload via the target web app's upload function
#    Note the save path — navigate to it in the browser
```

```bash
# 4. Browse to the shell, enter credentials, issue PowerShell commands
http://<target>/files/Upload.aspx
```

---

## Capabilities

| Action | Notes |
|---|---|
| Run PS commands | Executed as new processes each time |
| Upload files | Via the shell's upload function |
| Download files | Via the shell's download function |
| Execute scripts | Can load and run scripts from memory |
| Encode commands | Built-in encoding to help evade filters |

> Type `help` in the shell prompt for a list of available commands.

---

## Notes

> Credentials set on line 14 protect the shell — without them anyone who finds the URL can use it.

> Strip the ASCII art and comments before uploading — same as Laudanum, these are commonly signatured.

> Works best against Windows hosts running IIS with ASP.NET. Linux targets — use PHP/JSP shells instead.

---

## See Also

- [[Laudanum]] — multi-language web shell collection (includes ASPX, PHP, JSP, ASP)
- [[_Reference/Shells|Shells Reference]] — web shell one-liners and webroot paths
