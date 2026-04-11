# Contributing to NeptuneFriend

## Branch strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code. Auto-deploys to staging. |
| `develop` | Integration branch. Merge feature branches here first. |
| `feat/*` | New features |
| `fix/*` | Bug fixes |
| `chore/*` | Maintenance, deps, CI |

## Pull request process

1. Branch off `develop` with a descriptive name: `feat/wind-rose-component`
2. Write or update tests — PRs without tests for new behaviour are not merged
3. Ensure `npm run lint`, `npm run test`, and `npm run type-check` all pass locally
4. Open a PR against `develop` and fill in the PR template
5. At least one approval required before merge

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat(web):` — new frontend feature
- `feat(api):` — new backend feature
- `fix(web):` / `fix(api):` — bug fix
- `perf:` — performance improvement
- `ci:` — pipeline changes
- `infra:` — Terraform / K8s / Ansible changes
- `docs:` — documentation only

## Code standards

- TypeScript strict mode — no `any` without justification
- React components: functional only, hooks for side effects
- No direct DOM manipulation — use React refs when needed
- CSS: use CSS custom properties from `index.css` for theming
- API responses: always use Zod schemas for validation
