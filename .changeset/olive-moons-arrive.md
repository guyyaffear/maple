---
"@maple-kit/core": minor
---

Carry the configuration in the link, and remember what the viewer chose.

`@maple-kit/core/client` gains the preference model: `parseMapleQuery()` reads
`?maple=off|on`, `?maple-pos=`, `?maple-detail=`, `?maple-comment=` and
`?maple-new=` off a search string, `resolveConfig()` settles the order — query
string, then the viewer's stored preference, then props, then the defaults —
and `readPreferences()` / `writePreferences()` keep the two the viewer owns per
origin, treating a storage that throws on access as no preference at all. An
application setting `enabled: false` can never be overridden into being on;
turning Maple off from a link always works.

The controller now carries `detail`, `position`, `hidden` and `selected`, with
`setDetail`, `setPosition`, `setHidden` and `select` beside them. Hidden is for
the session and is not gone: a comment arriving, a pick being armed, a composer
opening or a link selecting a comment all bring the island back, so no state
change is discarded out of sight. `detail` is presentation only — the export
fence carries every field either way.

`formatContext()` takes that detail as a second argument: default detail reads
the window's width, the scheme and what was covering the page; developer detail
adds the layout width, the breakpoint, the device pixel ratio and the locale.
`opensComposer()` takes the key, so `shortcut` is an application's to choose.
