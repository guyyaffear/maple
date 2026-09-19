---
name: setup-maple-org
description: Register and install the Maple GitHub App for an organisation, wire the SDK route to it, and verify that a reviewer can sign in from a preview and post a pull-request comment. Use when setting up Maple for the first time in an organisation, installing the Maple GitHub App, changing which repositories are reviewable, or working out how reviewers sign in to Maple.
---

# Set up Maple for an organisation

This is the one-time setup a person with organisation owner rights has to do.
Nothing here can be automated from inside a repository: creating a GitHub App
and installing it both need a browser and an owner.

It takes about fifteen minutes. Work top to bottom; later steps use values
earlier ones produce.

Read `docs/github-auth.md` before or after, depending on whether you want the
reasoning first. This file is the sequence; that file is why the sequence is
this one.

Throughout, `acme` is your organisation and `acme/web` a repository you want
reviewable. Substitute your own.

## 1. Register the GitHub App

Go to **Organisation settings → Developer settings → GitHub Apps → New GitHub
App** and fill it in as follows.

| Field                                             | Value                                          |
| ------------------------------------------------- | ---------------------------------------------- |
| GitHub App name                                   | `Maple — acme`                                 |
| Homepage URL                                      | Your Maple deployment, or the Maple repository |
| Callback URL                                      | Your organisation's home page                  |
| Request user authorisation (OAuth) during install | Off                                            |
| Enable Device Flow                                | **On**                                         |
| Expire user authorisation tokens                  | **Off**                                        |
| Webhook → Active                                  | Off                                            |
| Where can this app be installed?                  | Only on this account                           |

Four of those need saying out loud.

**The App name has to be globally unique on GitHub.** `Maple` is taken.
Including your organisation in the name is the simplest way through, and
reviewers see it on the authorisation screen, so make it recognisable.

**The callback URL is never used.** Device Flow does not redirect anywhere, but
GitHub's form refuses to save without a value. Put your organisation's home page
in and ignore it.

**Device Flow must be on.** It is what lets a reviewer sign in from a preview
host whose URL is different on every deployment. Without it, the first sign-in
attempt fails with `device_flow_disabled` and nothing else about this setup
matters.

**Expire user authorisation tokens must be off.** With expiry on, refreshing a
token needs the App's `client_secret`, which would mean putting a GitHub secret
into every preview environment. That is the thing this design exists to prevent.
Off, the token is bounded by Maple's seven-day cookie instead, and the reviewer
can revoke it at any time.

Then set **Repository permissions** to exactly this, and nothing more:

| Permission      | Access         |
| --------------- | -------------- |
| `Issues`        | Read and write |
| `Pull requests` | Read-only      |

`Metadata: Read-only` is added by GitHub and cannot be removed. Leave every
other permission at **No access** — in particular `Contents`, which Maple does
not need because it never reads or writes repository code.

Create the App. You do not need to generate a private key: the private key is
for an App acting as itself, and Maple's comment path never does.

## 2. Install it on repositories

From the App's page, **Install App → acme**, then choose **Only select
repositories** and pick the ones that should be reviewable.

Install it on the repositories you actually review. The set you choose here is
the blast radius of every reviewer token Maple will ever issue, so keeping it
small is worth the minute it costs. You can add repositories later without
anyone signing in again.

## 3. Copy the client id

On the App's settings page, copy the **Client ID**. It starts with `Iv` and is
not the App ID printed above it — the two are easy to confuse and only one of
them works.

It is public. It appears in the authorisation URL every reviewer sees, and it is
safe in a preview environment, a build log and a configuration file in your
repository. It is the only GitHub identifier the preview needs.

Do not put an App ID, a private key or a client secret anywhere near a preview
environment.

## 4. Configure the SDK route

Set `MAPLE_GITHUB_CLIENT_ID` in the preview environment, and set
`MAPLE_COOKIE_KEY` to a random 32-byte value if you want the reviewer's cookie
encrypted at rest. Both go in your host's preview environment variables, not in
a file in the repository.

Mount the route behind your preview flag so it never exists in production:

```ts
import { readGitHubSession } from "@maple-kit/core/auth";
import { githubStore } from "@maple-kit/core/connectors";
import { createMapleHandler } from "@maple-kit/core/route";

const key = process.env.MAPLE_COOKIE_KEY;

const mounted =
  process.env.MAPLE_PREVIEW === "1"
    ? createMapleHandler({
        store: async (request) => {
          const session = await readGitHubSession(request, key ? { key } : {});
          return session ? githubStore({ owner: "acme", repo: "web", token: session.token }) : null;
        },
        githubAuth: {
          clientId: process.env.MAPLE_GITHUB_CLIENT_ID!,
          ...(key ? { key } : {}),
        },
      })
    : () => new Response("Not found", { status: 404 });

export { mounted as DELETE, mounted as GET, mounted as PATCH, mounted as POST };
```

The store is built per request from the reviewer's own token, which is what
makes the comment show up under their name rather than a bot's. Returning
`null` — nobody has linked yet — makes the route answer `401`, and the overlay
offers **Link GitHub** rather than writing the comment as somebody else.

`githubAuth` is what serves the three link endpoints. Without it they answer
`404`, which is the right shape for a deployment that stores comments some
other way and needs no GitHub sign-in at all.

## 5. Verify it end to end

Do all five. Stopping at the third is how a setup that looks finished turns out
not to be.

1. Open a preview for a branch that has an open pull request — say `web-482`
   against `acme/web`.
2. Click **Link GitHub** in the overlay. You should see an eight-character code
   and a link to `https://github.com/login/device`.
3. Enter the code and authorise. The authorisation screen should name your App
   and list `Issues` and `Pull requests` and nothing else.
4. Leave a comment in the overlay, then open the pull request on GitHub. The
   comment should be there, **authored by your own account**, not by the App.
5. Have a second person do steps 1 to 4 on the same preview. Their comment
   should be authored by them. That is the proof that tokens are per reviewer
   and not shared.

Then confirm the other half: fetch `/api/maple/comments?branch=web-482` against
a **production** build and expect a `404`. Maple should not exist there.

## What to tell your security team

Point them at `docs/github-auth.md`, which is written for exactly that reading.
The three facts that answer most of the questions:

1. **No GitHub secret exists in the preview environment.** Device Flow's token
   exchange needs only the `client_id`, which is public. There is no client
   secret, no private key and no shared token to leak.
2. **Every reviewer has their own token**, held in an `HttpOnly`, `Secure`,
   `SameSite=Lax` cookie scoped to the preview's own origin and to
   `/api/maple`. A stolen token is one person's, and they revoke it themselves
   from **Settings → Applications → Authorized GitHub Apps**.
3. **The permissions are the minimum.** `Issues: write` to post the comment,
   `Pull requests: read` to find the pull request, on only the repositories you
   installed the App on. No access to code, no merge, no settings.

## Troubleshooting

**The overlay says device flow is unsupported.** Device Flow is off on the App.
Turn it on under **Identifying and authorising users** and try again; no
reinstall is needed and nobody has to sign in twice.

**Sign-in works, posting a comment fails with a 404.** The App is not installed
on that repository. A user-to-server token only reaches repositories the App is
installed on, and GitHub answers with `404` rather than `403` for a repository
the token cannot see. Install it from step 2 and retry — the reviewer does not
need to sign in again.

**Sign-in works, posting fails with a 403.** The reviewer does not have write
access to the repository. A user-to-server token is bounded by the App's
permissions _and_ by what that user can already do; the App cannot grant someone
access they do not have. Give them repository access, or accept that they cannot
comment.

**"No pull request for branch …; Maple has nowhere to post."** The branch has no
open pull request. Maple stores comments as pull-request comments, so there is
nowhere to put one. Open the pull request, even as a draft, and the comment
posts.

**A reviewer is suddenly signed out, or every write fails with a 401.** Their
token was revoked — by them, or by the App being uninstalled. The cookie is
cleared on the first `401` and the overlay offers **Link GitHub** again. If it
happens to everyone at once, check whether the App is still installed on the
organisation.

**The codes never arrive and the route logs a GitHub 404 on
`/login/device/code`.** The `client_id` is wrong or empty. Check
`MAPLE_GITHUB_CLIENT_ID` in the preview environment — it is the **Client ID**
from the App's settings page, not the App ID.
