# rig

The lane's resident service: keeps a heartbeat, serves the status board, reads the night's run
log. Hono + JSX, rendered on the server, Node 22+.

Read first: `docs/vision.md`, `docs/styleguide.md`. Decisions: `docs/adr/`.

## Commands

- `pnpm dev` / `pnpm start`: serves on `PORT` (8787). Needs `.env` (copy `.env.example`).
- `pnpm test`: vitest. `pnpm typecheck`: tsc.

## How work moves here

1. A feature starts as a plan: `plan.md` at the root (one at a time). Finished plans live in
   `docs/plans/done/`.
2. The plan is split into GitHub issues: skill `plan-to-issues` (`.agents/skills/`). A human
   reviews the split before anything is published. GitHub issues out of reach: files in
   `docs/issues/` (ADR 0004).
3. Issues are worked by workers, one issue per worker, each on its own branch or worktree.
   Pick the model per issue: the strongest for logic, a cheaper one for views and tests.
4. A worker closes its issue with a closing comment, exactly this shape:

   ```
   done: <what changed, one line>
   worker: <harness> · <model> · <effort>
   commit: <sha or "none">
   ```

5. An issue is closed only when its "Done when" holds. If it can't hold yet, leave it open and
   say what it waits on. A step that waits on someone else (a reviewer looking) stays open until
   they have. `closes #n` in a commit message closes the issue on push, so leave it out of
   commits for such an issue and close it by hand with the closing comment.

### What every issue carries

- First line `Source: plan.md § <n>`, label `plan:morning-digest` (the plan's name), then
  `## Scope`, `## Done when`, `## Blocked by` (real `#n`, issues created in dependency order)
  and `## Worker` (which model should take it).
- Commit `src/<feature>/types.ts` before the parts that build on it, so parallel workers can start.

### Workers

- Worktree workers (`isolation: worktree`) may be unable to run git. Read their diff in the
  worktree, apply it on `main` yourself, and run tests and typecheck before you push.
- `.claude/worktrees` is git-ignored. Run vitest with `--exclude '.claude/**'`, or it also runs the
  worktrees' copies of the tests.
- No `pnpm` on the machine: `npm install --no-package-lock` works and adds no lockfile.

## Previews

- `npm run save-preview <night> <out>` saves `/digest/<night>` as one HTML file (default `var/`,
  ignored by git). Unset the marker for the clean copy: `LANE_MARKER= npm run save-preview ...`.
- Host: Netlify (`npx netlify-cli deploy --prod --dir <dir> --site <site id>`). Deploy from a
  folder outside the repo. Look up the id with `sites:list --json`; the site name alone fails.
- Every deploy keeps its own address. After taking the marker off, delete the old deploy
  (`netlify api deleteDeploy`) and fetch both addresses to check the marker is gone (ADR 0003).
- Check the public link by fetching it before you send it to a reviewer.

## Skills

Shared skills live in `.agents/skills/`, one folder each, `SKILL.md` inside. That folder is the
one source for every harness on the team. If yours loads skills from somewhere else, point it
here (a link or a config entry). Don't copy: copies drift.

## Rules

- Never commit `.env`, tokens or previews.
- Don't touch `runs/`: those are real nights, read-only fixtures.
- No client JS (ADR 0001).
