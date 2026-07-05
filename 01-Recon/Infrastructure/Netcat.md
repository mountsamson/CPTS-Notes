# Netcat (nc) Cheat Sheet

## What it is
`nc` (netcat) opens TCP/UDP connections, sends data, listens on ports, and scans for open ports. It's the "Swiss Army knife" of networking tools — scriptable, unlike `telnet`, and it keeps errors on stderr instead of mixing them into stdout.

## Syntax
```
nc [-46DdhklnrStUuvz] [-i interval] [-p source_port] [-s source_ip] [-T ToS] [-w timeout] [-X proxy_protocol] [-x proxy_address[:port]] [hostname] [port[s]]
```

## Common Uses
- Simple TCP proxies
- Shell-script HTTP clients/servers
- Testing network daemons
- SOCKS/HTTP proxy command for `ssh`
- Port scanning

## Flags Reference

| Flag | Description |
|---|---|
| `-4` | Force IPv4 only |
| `-6` | Force IPv6 only |
| `-D` | Enable socket debugging |
| `-d` | Don't read from stdin |
| `-h` | Show help |
| `-i interval` | Delay between lines sent/received, or between port connections |
| `-k` | Keep listening for new connections after current one ends (requires `-l`) |
| `-l` | Listen mode (incoming connection). Can't combine with `-p`, `-s`, or `-z` |
| `-n` | Skip DNS/service lookups |
| `-p source_port` | Set source port |
| `-r` | Randomize source/destination ports |
| `-s source_ip` | Set source IP (or UNIX socket file for datagrams). Can't combine with `-l` |
| `-T ToS` | Set IP Type of Service (`lowdelay`, `throughput`, `reliability`, or hex value) |
| `-t` | Handle RFC 854 telnet negotiation (for scripting telnet sessions) |
| `-U` | Use UNIX-domain sockets |
| `-u` | Use UDP instead of TCP |
| `-v` | Verbose output |
| `-w timeout` | Close connection after idle `timeout` seconds (ignored with `-l`) |
| `-X protocol` | Proxy protocol: `4` (SOCKS4), `5` (SOCKS5, default), or `connect` (HTTPS) |
| `-x address[:port]` | Proxy address/port (default: 1080 SOCKS, 3128 HTTPS) |
| `-z` | Scan for listening services only, don't send data. Can't combine with `-l` |

## Quick Examples

**TCP connection:**
```
nc host.example.com 42
```

**UDP connection:**
```
nc -u host.example.com 53
```

**Listen for incoming TCP connection:**
```
nc -l 1234
```

**Port scan a range:**
```
nc -zv host.example.com 20-100
```

**Chat/file transfer (listener side):**
```
nc -l 1234 > received_file
```

**Chat/file transfer (sender side):**
```
nc host.example.com 1234 < file_to_send
```
