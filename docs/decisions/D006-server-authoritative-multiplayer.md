# D6: Server-authoritative multiplayer

Status: current

The Odin sim runs headless on the server as the single world truth; clients
send tick-quantized intents and render state deltas with client-side
prediction and resim-based reconciliation; interest is chunk-scoped;
per-chunk hash checkpoints are the desync tripwire. Go services enumerate
gateway, sessions, worker supervision, persistence, replication only. This
replaces the research-era lockstep archetype as the default; lockstep is dead
for this engine.
