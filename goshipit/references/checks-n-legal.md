# Category N — Legal & Compliance

| ID  | Check                                                                                                                                                                                                          | P   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| N1  | `/privacy-policy` or `/privacy` route/page missing                                                                                                                                                             | P1  |
| N2  | `/terms` or `/terms-of-service` route/page missing                                                                                                                                                             | P1  |
| N3  | Analytics/tracking/ad scripts detected but no cookie consent/banner lib (GDPR/CCPA)                                                                                                                            | P1  |
| N4  | Payment processing detected but no refund/cancellation policy page linked at checkout                                                                                                                          | P1  |
| N5  | Footer missing Privacy + Terms links                                                                                                                                                                           | P2  |
| N6  | _(only if auth detected)_ No data export endpoint (`/export`, `/download-my-data`, `/gdpr/export`) → GDPR Art. 20                                                                                              | P1  |
| N7  | _(only if auth detected)_ No data deletion endpoint (`/delete-account`, `/gdpr/delete`, `/account/erase`); deletion handler only sets `isDeleted: true` without removing/anonymising DB records → GDPR Art. 17 | P1  |
