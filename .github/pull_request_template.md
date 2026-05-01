## PR Checklist (Mandatory)

- [ ] Branch follows `branch-strategy.mdc` naming format and targets correct integration branch.
- [ ] Commits follow `commit-convention.mdc` (`feat`, `fix`, `refactor`, etc.).
- [ ] API changes follow `api-contract.mdc` and `api-error-standard.mdc`.
- [ ] If API changed, docs were updated in `backend/docs/api/*` in this same PR.
- [ ] If DB schema changed, migration follows `database-migration-safety.mdc` and includes rollback intent.
- [ ] No secrets or credentials are committed (`security-env-secrets.mdc`).
- [ ] Auth/session behavior follows `auth-session-rules.mdc`.

## Change Summary

Describe what changed and why.

## Risk and Rollout Notes

Describe user impact, migration needs, and rollback considerations.
