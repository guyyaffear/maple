---
"@maple-kit/core": patch
"@maple-kit/ui": minor
---

Each call in the mock box has one button naming its state instead of nine
segmented buttons. It opens a menu of Real, marked with a green dot as what the
page does on its own, and the nine states; arrow keys move through it, and
scrolling the box closes it. `watchEscape` from `@maple-kit/core/client` now
leaves an open `popover="auto"` its own Escape, so Escape inside the menu
closes the menu and not the box. `ChevronIcon` joins `@maple-kit/ui/icons`.
