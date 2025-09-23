# urmind

A browser extension built with WXT and React.

## Development

Install dependencies:

```bash
bun install
```

Start development server:

```bash
bun run dev
```

Build for production:

```bash
bun run build
```

## Tech Stack

- [WXT](https://wxt.dev/) - Web extension framework
- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Bun](https://bun.sh/) - Fast package manager and runtime

## Database

Managing indexdb database from devtool within service worker isn't straight forward. By design, indexdb or any storage aren't meant to be visible within devtool inside service worker ().

To view/manage indexdb:

1. Open devtools
2. Select "Sources" tab
3. Select one of your application file, right click and open in new tab.
4. Open devtool within the new tab. i.e (chrome-extension://<id>/content-scripts/content.js)
5. Select "Application" tab.
6. Select "IndexedDB" from the left sidebar.
7. You should see the database name and version.
8. Select the database and click on "Open Database" button.
9. You should see the database in the new tab.
10. You can now view/manage the database.
