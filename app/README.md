# Pentest Vault

A desktop note-taking app for this vault — built to replace Obsidian with something
tailored to pentesting notes: markdown notes with tags/wikilinks, a properties panel
for box metadata (difficulty, OS, IP, location), and a world map of where your
engagements/boxes are.

It reads and writes the same plain `.md` files already in this folder tree — nothing
proprietary, nothing locked in.

## Running it

```bash
npm install
npm run dev
```

This starts Vite + Electron together and opens the app pointed at the vault (the
parent of this `app/` folder) by default. Change the vault folder any time via
**File → Change Vault Folder…**.

## Building a standalone app

```bash
npm run pack
```

Produces `release/mac-arm64/Pentest Vault.app`. Since it's unsigned, the first time
you open it macOS Gatekeeper will complain — right-click the app → **Open**, or run:

```bash
xattr -cr "release/mac-arm64/Pentest Vault.app"
```

`npm run dist` builds an installer (`.dmg`) instead, if you want one.

## Features

- **Sidebar** — full folder tree of the vault, with new note/folder, rename, delete
  (moves to OS Trash, not permanent), and reveal-in-Finder for non-markdown files.
- **Editor** — edit / preview / split view, autosaves ~700ms after you stop typing
  (or ⌘S to force it now).
- **Wikilinks & tags** — `[[Note Name]]` and `#tags` work exactly like they already do
  in your notes. Clicking a `[[link]]` that doesn't exist yet offers to create it;
  clicking a `#tag` filters the sidebar to every note with that tag.
- **Backlinks** — every note shows what links to it, at the bottom of the editor.
- **Properties panel** — optional structured metadata per note (tags, difficulty,
  OS, IP, country) stored as YAML frontmatter. Setting a country is what puts a pin
  on the map — it's the only field the map view reads.
- **⌘K command palette** — fuzzy search across note names, tags, headings, and body
  text from anywhere.
- **World Map tab** — every note with a location pins itself on an interactive world
  map; pins are colored by difficulty (green/yellow/red) when set, sized by how many
  notes share that location. Click a pin to open the notes there.

## Project layout

- `electron/` — main process + preload (plain CommonJS, not bundled by Vite).
  `vault.js` holds all filesystem logic, sandboxed to the configured vault root.
- `src/` — the React renderer (Vite + TypeScript).
- `scripts/dev.mjs` — starts Vite, waits for it, then launches Electron pointed at it.
- `scripts/verify-logic.ts`, `scripts/verify-vault-fs.cjs` — standalone checks for the
  markdown/frontmatter parsing and the file-CRUD logic (`npm run verify`), useful
  since they don't require actually launching the Electron window.
