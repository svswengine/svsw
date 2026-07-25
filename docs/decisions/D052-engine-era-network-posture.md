# D52: Engine-era networking is trusted-network only

Status: current
Date: 2026-07

Stage 5 stands up a QUIC gateway with TLS 1.3 and session tokens (D18,
S27a), which reads as an internet-facing surface while SECURITY.md
declares the mod sandbox the only boundary and considers no network
surface at all. The engine era resolves this by scope rather than by
hardening: every engine-era gate runs on localhost, on netns, or between
two machines the maintainer owns, so the gateway is dev and
trusted-network software until a spec says otherwise, and its tokens
distinguish sessions rather than defending against forgery. SECURITY.md
says so plainly, so nobody deploys it publicly on the strength of the
word gateway. Accounts and identity are out of engine scope; S27a's
minimal session store means named sessions and tokens, nothing more.
Declaring the client-gateway surface a second security boundary now is
rejected: an unhardened boundary that promises hostile-client resistance
is worse than a stated scope limit, and the hardening work has no
consumer before a shipped multiplayer product exists. Internet-facing
hardening, hostile-client gate legs (forged and expired tokens rejected,
malformed session traffic contained, per-connection resource bounds)
and any identity story are post-engine work, and the post-engine roster
names them. Adopted from the 2026-07-25 adversarial review at the
maintainer's direction.
