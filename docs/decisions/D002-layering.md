# D2: Layering discipline

Status: current

The engine is a strict one-way layer stack: scripts above the scripting
boundary, the engine core below it, the platform tier at the bottom. Only the
platform tier touches the backend; the renderer's core stays backend-agnostic
behind a thin GPU-submission stratum. Script code never names engine
internals, the platform, or the network. D14 extends this law to the C
interface tier; boundary-scan polices it.
