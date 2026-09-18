# Owner setup

Everything in this file has to be done by a person with owner rights. None of it
can be automated from inside the repository, which is why it is a checklist
rather than a script. Work top to bottom; later steps depend on earlier ones.

Nothing here should ever be committed. Where a step produces a credential, keep
it in a password manager and inject it with `op run --env-file`, never in a file.

---

## 1. The npm scope `@maple-kit` — done

The organisation exists and the packages publish as `@maple-kit/core`,
`@maple-kit/cli` and `@maple-kit/mcp`. The unhyphenated `maplekit` was
unavailable on npm, which is why the scope matches the GitHub organisation
rather than being shorter than it.

Two things remain, both under the npm organisation's settings:

- **Members**: add anyone who will publish.
- **Require two-factor authentication** for all members.

Publishing needs `registry.npmjs.org`, so it cannot be done from a network that
blocks or proxies it.

## 2. Configure the GitHub organisation

1. The repositories live under the `maple-kit` organisation.
2. In **Settings → Actions → General**, set workflow permissions to
   _Read repository contents and packages permissions_. The workflows here ask
   for anything more per job.
3. **Dependabot alerts** and **Dependabot security updates** are already enabled
   on all three repositories.
4. **Secret scanning and push protection are not available yet.** On a Free
   organisation they need GitHub Advanced Security for private repositories; the
   API refuses them with _"Secret scanning is not available for this
   repository."_ They cost nothing on a public repository, so enable them as
   part of the flip — see section 6. Until then the gitleaks hook and the
   gitleaks CI job are the only secret controls, and a contributor can skip the
   hook with `--no-verify`.
5. **Private vulnerability reporting** is likewise public-repository only.
   `SECURITY.md` links to it, so turn it on at the flip or that link is dead.
6. _Allow members to create public repositories_ cannot be turned off on a Free
   organisation; GitHub refuses a private-only creation policy. Nothing to do.

## 3. Enable Socket.dev

Socket reviews every dependency change for install scripts, obfuscated code and
sudden maintainer changes. It is the control that catches a compromised release
that a version bump alone would hide.

Installing a third-party GitHub App needs a person to authorise it in a browser.
There is no API for it, which is the only reason this section is manual.

1. Install the GitHub app from <https://github.com/apps/socket-security> onto
   the `maple-kit` organisation.
2. Grant it access to all repositories, including future ones.
3. Confirm whether the free tier covers private repositories on your plan. If it
   does not, note it and enable Socket at the point the repositories go public;
   do not leave it half-configured.
4. **Start it in report-only mode, not as a required check.** Socket's
   `Obfuscated code` rule fires on minified and generated files, so it flags
   mainstream packages: `highlight.js`, every `@mswjs/interceptors@0.41.x`, and
   every version of `better-sqlite3` were all refused by a registry mirror
   running this engine during Phase 0. As a merge gate that would block real
   work. Watch what it reports for a few weeks before making it blocking.

Verify: open a pull request that adds a dependency and confirm Socket comments.

## 4. Register the GitHub App

One app serves both the comment posting in US1 and the merge gate in US2. Create
it now so the app id and key exist before the code needs them.

The quickest route is an **app manifest**: POST one to
`https://github.com/organizations/maple-kit/settings/apps/new` from a local page,
review GitHub's confirmation screen, and the app is created with every permission
below already set. A manifest cannot enable Device Flow or generate the key, so
4a and step 7 apply either way.

Filling the form by hand instead:

1. Go to **Organisation settings → Developer settings → GitHub Apps → New**.
2. Name it `Maple`. Homepage: `https://github.com/maple-kit/maple`.
3. **Uncheck Webhook → Active** for now. US2 turns it on with a real URL.
4. Under **Identifying and authorising users**:
   - **(4a) Enable Device Flow.** This is what lets a reviewer sign in from a
     preview host without a redirect URI per deployment, and it is the one
     setting a manifest cannot carry. Maple's login story depends on it.
   - Enable **Expire user authorisation tokens**.
   - Leave **Request user authorisation (OAuth) during installation** off.
5. Permissions — **Repository**:
   | Permission    | Access         | Why                                                                                                                             |
   | ------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
   | Checks        | Read and write | The `maple/visual-review` check run is the merge gate.                                                                          |
   | Pull requests | Read and write | Posting and updating the sticky comment.                                                                                        |
   | Contents      | Read-only      | Reading the commit a comment was anchored against.                                                                              |
   | Merge queues  | Read-only      | Required to subscribe to `merge_group` at all. Without it GitHub rejects the event and a queued merge hangs instead of passing. |
   | Metadata      | Read-only      | Mandatory.                                                                                                                      |
6. **Where can this app be installed?** Any account, so other organisations can
   use the gate.
7. Create the app, then:
   - Note the **App ID** and the **Client ID**.
   - Generate a **private key** and store the `.pem` in a password manager. It
     is downloaded once and never shown again. `*.pem` is gitignored, but the
     file should not be in the working tree at all.
8. Install the app on the `maple-kit` organisation.

## 5. Branch protection

On `maple-kit/maple`, protect `main`:

- Require a pull request before merging, with one approval.
- Require status checks to pass: `lint`, `typecheck`, `test`, `gitleaks`,
  `publint`, `dco`.
- Require branches to be up to date before merging.
- Require signed commits.
- Do not allow force pushes or deletions.

Once the `maple/visual-review` check is live, add it as required and pin its
`integration_id` to the app from step 4 in the ruleset. Without that pin anyone
with push access can post a passing status under that name.

## 6. Before the repositories go public

- Re-read the history for anything that should not be published:
  `git log -p | grep -iE "<your own patterns>"`. The repositories were written
  to be publishable, so this should find nothing.
- Run `gitleaks detect --source . --log-opts="--all"` over the full history.
- Publish `SECURITY.md`'s reporting address and confirm it is monitored.
- Turn on Socket if section 3 deferred it.
- **Enable secret scanning, push protection and private vulnerability
  reporting.** All three are free on a public repository and were unavailable
  while these were private.
