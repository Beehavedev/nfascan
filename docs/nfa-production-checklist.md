# NFA Production Checklist & Gap Assessment

This document maps requested controls for non-fungible-agent indexing/explorer reliability to the current implementation.

## Requested controls

### Before mainnet launch

- [x] Proxy resolution implemented + tested (implemented, no automated tests)
  - `server/sync.ts` resolves `logicAddress` from Etherscan proxy metadata.
- [ ] Indexer supports reorg rollback
  - No rollback/reconciliation strategy exists in the sync pipeline.
- [ ] Cursor pagination on all lists
  - Public list APIs are offset-based (`limit` + `offset`), not cursor-based.
- [ ] Rate limiting on all public endpoints
  - No global/per-route API rate-limiter middleware is installed.
- [ ] Trust score explainable per-signal per-agent with tx links
  - Score formula exists, but no per-agent explainability endpoint and no tx evidence links.
- [ ] "Verified" label renamed/scoped unless hard guarantee exists
  - `verified` currently combines different evidence levels (verified source vs protocol-known entries).
- [ ] Backfill jobs + index health dashboard
  - Initial+periodic sync exists, but no explicit health dashboard/metrics surface.
- [ ] Contract allowlist + signed attestation for "official" sources
  - Some protocol contracts are hardcoded, but no attestation/signature workflow.

### After launch

- [ ] Monitor: RPC errors, lag, reorg counts, API latency
  - Logging exists, but no dedicated telemetry/alerting implementation.
- [ ] Attack monitoring for mass registrations/dummy ABIs/spam tx patterns
  - Not currently implemented.
- [ ] Periodic rescoring + alerts on upgrades/admin changes
  - Not currently implemented.

## Bytecode-level selectors and runtime behavior checks

### Current state

- ABI/source pattern matching is used for BAP-578 compliance scoring.
- Transaction method decoding is selector-based from tx input.

### Gaps

- No explicit bytecode-level selector presence scan against deployed runtime bytecode.
- No runtime call/trace sanity checks (e.g., simulation/invariant checks per claimed interface).
- No event consistency rule enforcing that contracts claiming `updateLearningTree` emit expected learning events in observed history.

## Recommendation: verification policy

Treat ABI/source matching as a weak signal.

Recommended confidence ladder:

1. **Claimed**: ABI/source keyword match only.
2. **Observed**: selectors present in runtime bytecode + real calls observed.
3. **Consistent**: expected events emitted for claimed capabilities.
4. **Attested**: official allowlist + signed provenance.

Only levels 3-4 should drive user-facing "verified" style badges.
