# Auto-Close Old Tabs

Like Arc's auto-archive, for Firefox. Unpinned tabs you haven't viewed for a while are closed automatically, so your tab bar stays short.

## What gets closed

Tabs you haven't viewed in **12 hours** by default (24 hours, 7 days, 30 days or never in settings), except:

- pinned tabs
- the tab you're looking at in each window
- tabs in tab groups (optional)
- tabs playing audio (optional)
- sites on your exclusion list
- the last remaining tab in a window, so windows don't close out from under you

As in Arc, time keeps counting while Firefox is closed.

## Getting a tab back

Tabs are closed normally, so Firefox's own tools find them: **History** (Cmd-Y) to search everything, or **History → Recently Closed Tabs** for the latest ones. The extension doesn't keep a list of its own.

## Development

```bash
npx web-ext run
npx web-ext lint
```

Licensed under the [GNU General Public License v3.0](LICENSE).
