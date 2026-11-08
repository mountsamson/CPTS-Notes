

Nov 8, 2026 · @Carl · Notes from mentor (Dalan), living document

## Goals at the start of every case

1. Find **all** the IoCs.
2. Use the IoCs to build a **master search** (a KQL query).

## Ground rules

- Pull and triage **ALL** IPs from **every** source type.
- Set the time filter to **max**.
- **Never include Microsoft (MS) IPs** in the IoC list.
- Work from IPs → threat actor (TA) session → all IPs tied to that session → back to a complete list.

## Phase 1: Build the IoC list

### Step 1. Pull all IP addresses

Extract every IP address from the logs for the user under investigation.

### Step 2. Enrich the IPs

Check each IP to decide which are malicious IoCs. Use [AbuseIPDB](https://www.abuseipdb.com/) to look at the abuse confidence score, report history and geolocation.

### Step 3. Search Sentinel for matches

Search Sentinel for the IPs you have flagged to see where else they appear.

### Step 4. Round off your IoCs using the TA session

Use the malicious IPs to find the threat actor's **SessionID**.

### Step 5. Return all IPs again using the SessionID

Pull every IP associated with the TA session.

- Correlate against your known bad IPs to see if you missed any.
- Still exclude MS IPs.

### Step 6. Finalise the complete IoC list

- IP addresses
- SessionIDs

### Step 7. Create the master search

Turn the finished IoC list into a single KQL query (see Phase 2).

## Phase 2: Master search (KQL)

The query returns activity from the known bad IPs **or** the TA's session for the affected user.

```kql
let badIps = dynamic([
"3.106.24.201",
"45.91.20.57",
"45.91.20.8",
"45.91.20.10",
"200.162.148.32",
"200.162.148.39",
"200.162.148.102",
"200.162.148.120",
"200.162.148.121",
"200.162.148.165",
"200.162.148.197",
"200.162.148.238",
"200.162.148.246",
"212.30.33.5",
"212.30.33.10",
"212.30.33.16",
"212.30.33.21",
"212.30.33.25",
"212.30.33.27",
"212.30.33.38",
"212.30.33.44",
"212.30.33.47",
"212.30.33.49",
"212.30.33.162",
"212.30.33.233",
"212.30.33.236"
]);
OfficeActivity
| where UserId == "kenneth.baker@wdlabs.com.au"
| extend SessionID = tostring(parse_json(AppAccessContext).AADSessionId)
| where ClientIP in (badIps) or SessionID == "008dc8fa-0f13-0d4c-48fa-205d73e4c573"
```

**How it works**

- `badIps` holds the confirmed malicious IPs from Phase 1.
- `SessionID` is extracted from `AppAccessContext` (the `AADSessionId` field).
- The final `where` catches anything from a bad IP **or** from the TA's session, which picks up activity from IPs you may not have flagged yet.

To reuse on a new case, swap in the new `badIps`, `UserId` and session ID.

## Phase 3: After the master search

1. **Find the initial access login.**
2. **Build a timeline** of the important activity with the master search. You can summarise things like downloaded files and emails.
3. **Explain the activity** from the logs. You should be able to say in plain English what the TA is trying to achieve.
4. **Move into mailbox analysis.**

## Quick checklist

- Time filter set to max
- IPs pulled from every source type
- IPs enriched (AbuseIPDB)
- Sentinel searched for matches
- TA SessionID(s) identified
- All IPs for the session returned, MS IPs excluded
- IoC list complete (IPs and SessionIDs)
- Master search built
- Initial access login found
- Timeline built
- Plain-English explanation written
- Mailbox analysis started

## Tools

- [AbuseIPDB](https://www.abuseipdb.com/): abuse confidence score, reports and geolocation for any IP.
- Microsoft Sentinel: KQL searches (e.g. the `OfficeActivity` table).

## To be added

More notes to come from the mentor.