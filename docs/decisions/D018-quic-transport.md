# D18: Network transport: QUIC client<->gateway; loopback TCP gateway<->worker

Status: current

Client↔gateway runs QUIC (quic-go): reliable ordered streams for
session/state traffic, unreliable QUIC datagrams for per-tick intents and
deltas, TLS 1.3, connection migration. Chosen over raw TCP/TLS (head-of-line
blocking stalls the prediction stream under loss) and over WebRTC/pion
(NAT-traversal and browser machinery this program does not target;
WebTransport is the QUIC-native door if the maintainer ever adds a web
target). Gateway↔worker runs the v1 length-prefixed protocol over loopback
TCP; supervised same-host processes need no datagram semantics. The
coop-smoke gate injects latency, loss, and reordering.
