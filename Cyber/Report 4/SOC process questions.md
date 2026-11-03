

1. Anchor the investigation: What alert fired, on what host, as which account, at what time.
done

2. Walk the process tree: From top to bottom until you find the the process/activity that doesn't belong (usually has the red zap icon, indicating detected malicious activity). Note down the malicious activity.
done

3. Translate, don't transcribe. For each malicious activity you noted down, write in your own words: what they ran (the evidence/command etc - understand it in detail, research etc) → what it achieved (stolen creds?)→ What technique is this? (MITRE ATT&CK ID - learn whats happening here and the risk associated, start thinking about what impact this could have, that will inform your containment recos).

4. KQL Pivot: As a habit, use Advanced Hunting KQL to search for other activity on that device (around the same timeframe of the alert +-10 mins). See if anything else happened that didnt get picked up by Defender. If you see something, go back to step 3. If nothing jumps out, no problem just move on.

5. Check the blast radius: Does the alert/incident indicate another host was involved? If so and you want to check that host for activity as well, do a KQL pivot.

6. Finishing touches: Determine a verdict, did it succeed? Come up with your 3-5 containment steps. Couple screenshots, note KQL queries, check for mistakes and typos.