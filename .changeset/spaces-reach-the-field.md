---
"@maple-kit/ui": patch
---

Typing a space in the composer types a space. Hold-to-peek listens on `window`,
where a shadow root has already retargeted the event to the overlay's host, so
its "not while you are typing" guard saw a `div` for every key and swallowed
every space. A comment could only ever be one word.
