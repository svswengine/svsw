# D11: Animation is presentation-only, off-hash, client-side

Status: current

The sim carries deterministic capsules/AABBs for all combat/interaction;
poses never enter `hash_world`. The upgrade path (deterministic per-joint
keypoints as sim state) is logged now for future product demand and is not
built.
