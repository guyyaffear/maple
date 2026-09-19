---
"@maple-kit/ui": patch
---

Stop the island header's two controls sharing a hit area.

`.mk-iconbtn` was 28px wide with an 8px gap, so the 40px squares `.mk-hit`
centres on each of them overlapped by four pixels, and the settings control
lost that strip to the close control painted after it. The buttons are 32px
now, which with the header's gap puts their centres exactly 40 apart. The marks
carry a collision resolver for the same reason; the header had nothing.
