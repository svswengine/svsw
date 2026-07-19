# D15: Go<->engine boundary: versioned wire protocol over a process boundary

Status: current

The gateway and the headless sim worker are separate processes speaking a
versioned, checksum-first, length-prefixed frame protocol with explicit
version negotiation and a supported-version whitelist; one schema in
`protocol/` with conformance-tested Odin and Go codecs. cgo in-process
embedding is rejected: it forfeits process isolation (watchdog/epoch-fenced
supervision needs a killable unit), couples toolchains and deploys, and
creates an unversioned ABI seam, the stopgap option under the longest-run
rule. Two-stage freeze: envelope plus the three-call worker contract at the
stage 5 walking skeleton (with message-kind ranges reserved for replication
and future private-service growth); replication message kinds land at the
stage 5 exit gate.
