# D49: Editor message kinds and the editor-worker transport

Status: current
Date: 2026-07

Amends D15 and D18 where the editor's use of the versioned protocol was
unprovisioned. D15 reserved message-kind ranges for replication and
future private-service growth; the editor already puts command traffic
on the same protocol from its stage-3 walking skeleton (S16b), with
inspection, log and debug traffic following in stage 4, all before the
stage-5 S26 envelope freeze, and D44's one-binary worker parses the
gateway vocabulary and the editor vocabulary from one dispatch table, so
an unreserved editor kind can collide with a reserved one without either
spec noticing. D15 therefore reserves a third message-kind range, editor
and tooling traffic, owned by the editor-era specs. Editor kinds never
freeze: the editor and its workers build from one tree, so cross-version
vocabulary compatibility arises only when a dev-loop rebuild leaves an
old editor talking to a new worker, and S22's protocol-mismatch policy
handles that by negotiation rather than by a frozen vocabulary. The
range reservation is what protects the frozen v1 envelope, and S26's
exit re-greens editor-roundtrip-check against that envelope to prove it.
D18 gains the transport sentence it lacked: editor-worker runs the same
length-prefixed protocol over the same loopback transport as
gateway-worker, so a Session worker exposes exactly one listening
discipline whichever supervisor spawned it, and the editor specs inherit
this rather than deciding it. Adopted from the 2026-07-25 adversarial
review at the maintainer's direction.
