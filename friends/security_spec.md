# Security Specification for FriendAtlas

## 1. Data Invariants
- `friends`: Every friend node document must have a valid string ID, name (<= 100 chars), handle (<= 60 chars), optional avatarUrl (<= 500 chars), interests list (<= 25 items), and bio (<= 300 chars).
- `connections`: Every edge document must have a valid string ID, source (<= 128 chars), target (<= 128 chars), and strength (number between 1 and 5).
- `settings`: Holds graph configurations such as cluster display names.

## 2. Invariants & Rules
- Default deny catch-all at root.
- Read is public so that friend group members can inspect the graph and connections without mandatory sign-in.
- Create / Update / Delete validated strictly via shape helpers to prevent malformed or oversized payloads.
