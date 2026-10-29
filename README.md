# Tab Auto-Archive

Arc-style auto-archive for Firefox. Unpinned tabs you haven't viewed for a while are closed and saved to an archive. Click the toolbar button to search the archive and restore tabs.

## What gets archived

Tabs you haven't viewed in **12 hours** by default (24 hours, 7 days, 30 days or never in settings), except:

- pinned tabs
- the tab you're looking at in each window
- tabs in tab groups (optional)
- tabs playing audio (optional)
- sites on your exclusion list
- the last remaining tab in a window, so windows don't close out from under you

As in Arc, time keeps counting while Firefox is closed.

## The archive

Click the toolbar button to see archived tabs grouped by day. Search by title or URL, and click an entry to reopen it (Cmd/Ctrl-click opens it in the background). *Archive tab* archives the current tab right away. The archive holds your latest 1,000 tabs and stays on your machine.

## Development

```bash
npx web-ext run
npx web-ext lint
```

MIT licensed.
