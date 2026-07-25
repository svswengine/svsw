# D31: Public/private documentation split

Status: current
Date: 2026-07

The public repositories stay agnostic to any private product's specifics: no
mechanic, service name, or genre framing appears in their docs. Design and
mechanics for any downstream product live outside this repository. Engine
specs reference private product requirements as their gameplay-requirements
source (D4) without restating them; a spec scoped by that source cites
"private product requirements." The engine's public Go-tier vocabulary is
gateway, sessions, worker supervision, persistence, replication; a private
product's own service layer is documented only in its own repository. The
rule is zero private-product references in the public engine docs, boundary
pointers included: no phrasing that names or points at the private repository
or its contents; the public engine story ends at engine completion. The
course repo keeps its path labels. Amended by D37: the repository's public
issue tracker is a documentation surface too, so ticket titles and bodies,
wayfinder maps, and the comments on them fall under the same rule, boundary
pointers included.
