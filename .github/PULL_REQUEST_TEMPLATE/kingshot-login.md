---
name: Kingshot login change
about: Security checklist for member authentication work
title: "feat(auth): "
labels: ""
assignees: ""
---

## Summary

## Preview

- Vercel preview URL:
- Supabase environment: isolated development only
- `K710_ENVIRONMENT`: preview
- `KINGSHOT_API_MODE`: mock / approved live provider

## Security checklist

- [ ] No production credentials or member data used
- [ ] No secret/service-role key reaches browser code
- [ ] Kingshot lookup is not used as proof of ownership
- [ ] Unknown member and wrong PIN have indistinguishable responses
- [ ] Rate limiting and cooldown tested
- [ ] Session tampering and expiry tested
- [ ] PIN change requires current PIN and revokes sessions
- [ ] Migrations enable RLS and use least-privilege grants
- [ ] Security-advisor output reviewed
- [ ] Rollback steps documented

## Tests

Paste commands and results.

## Database changes

List migrations and rollback/forward-fix plan.

## Owner decisions required

List any live Kingshot endpoint, data-retention, recovery, or production migration decisions.
