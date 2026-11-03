SigninLogs
| project TimeGenerated, IPAddress, UserDisplayName
| where UserDisplayName  contains "Kenneth Baker"

![[Pasted image 20261018204411.png]]


![[Pasted image 20261018205732.png]]

flagged ip addresses

202.179.130.249
3.106.24.201
200.162.148.102
200.162.148.238
200.162.148.246
200.162.148.32
200.162.148.197
200.162.148.120
45.91.20.8
45.91.20.57
212.30.33.5
212.30.33.38
212.30.33.236
212.30.33.16
212.30.33.27
212.30.33.162
212.30.33.47
212.30.33.10
212.30.33.233
212.30.33.49
202.179.130.249
3.106.24.201


Checking outlook events

![[Pasted image 20261018210253.png]]



Office 365 activities logs 

OfficeActivity
| where TimeGenerated > ago(60d)
| where UserId contains "kenneth.baker"
| order by TimeGenerated desc

![[Pasted image 20261018211426.png]]

Office 365 logs based on Kennth Bakker
![[query_data (4).csv]]

Flagged IP addresses matches Kennth Office Activity logs


| Time (UTC)      | Flagged IP                      | Operation      | Detail                                                                                                                                               |
| --------------- | ------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 30 Sep 09:57:41 | 200.162.148.32 (ExpressVPN, NL) | PagePrefetched | SharePoint `/sites/WDLabsOperations/SitePages/CollabHome.aspx`. Chrome 154 on Windows.                                                               |
| 3 Oct 05:09:44  | 212.30.33.49 (M Nets, ES)       | Set-InboxRule  | Modified the rule “Delete Spam”. It now matches subjects containing `training;phishing;scam`, marks them as read and stops processing further rules. |
| 3 Oct 05:17:22  | 212.30.33.49                    | Create         | Draft “Re: training” created through OWA.                                                                                                            |
| 3 Oct 05:17:56  | 212.30.33.49                    | Send           | The “Re: training” draft was sent to Naomi Hunter, Donald Anderson and Natasha Romanenko.                                                            |



| Time (UTC)          | Flagged IP     | UserId                                                            | RecordType    | Workload   | Operation      | Client / User Agent         | Detail                                                                                                                                                                         |
| ------------------- | -------------- | ----------------------------------------------------------------- | ------------- | ---------- | -------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-09-30 09:57:41 | 200.162.148.32 | [kenneth.baker@wdlabs.com.au](mailto:kenneth.baker@wdlabs.com.au) | SharePoint    | SharePoint | PagePrefetched | Chrome 154, Windows 10      | [https://wdlabsoutlook.sharepoint.com/sites/WDLabsOperations/SitePages/CollabHome.aspx](https://wdlabsoutlook.sharepoint.com/sites/WDLabsOperations/SitePages/CollabHome.aspx) |
| 2026-10-03 05:09:44 | 212.30.33.49   | [kenneth.baker@wdlabs.com.au](mailto:kenneth.baker@wdlabs.com.au) | ExchangeAdmin | Exchange   | Set-InboxRule  | (blank)                     | Rule “Delete Spam”: SubjectContainsWords=training;phishing;scam; MarkAsRead=True; StopProcessingRules=True                                                                     |
| 2026-10-03 05:17:22 | 212.30.33.49   | [kenneth.baker@wdlabs.com.au](mailto:kenneth.baker@wdlabs.com.au) | ExchangeItem  | Exchange   | Create         | OWA, Chrome 154, Windows 10 | Subject: Re: training; Folder: \Drafts                                                                                                                                         |
| 2026-10-03 05:17:56 | 212.30.33.49   | [kenneth.baker@wdlabs.com.au](mailto:kenneth.baker@wdlabs.com.au) | ExchangeItem  | Exchange   | Send           | OWA, ViaProxy               | Subject: Re: training; Recipients: naomi.hunter, donald.anderson, natasha.romanenko @wdlabs.com.au                                                                             |