---
name: classic-ide-ui
description: Design rules for all UI work in this project — layout, components, colors, typography, spacing, charts, copy. Enforces a classic VS Code / Antigravity-style developer-tool look (dark, dense, flat, monospace data). Use before creating or editing any page or component.
---

# Classic IDE UI

Goal: it should feel like an editor, not a SaaS landing page. Quiet, flat, dense, keyboard-friendly, information first.

## Layout (desktop)

```
┌──────────────────────────────────────────────────────────┐
│ Title bar: app name · GitHub user · sign out             │
├───────────────┬──────────────────────────────────────────┤
│ SIDEBAR       │ [Overview] [Timeline] [Pull Requests]    │
│ REPOSITORY    ├──────────────────────────────────────────┤
│ DATE RANGE    │ main content, like an open document      │
│               │                                          │
├───────────────┴──────────────────────────────────────────┤
│ Status bar: repo · range · time zone · user              │
└──────────────────────────────────────────────────────────┘
```

- Title bar: app name, signed-in GitHub user, sign out.
- Sidebar: resizable and collapsible; stacked sections with small uppercase headers (REPOSITORY, DATE RANGE).
- Editor tabs: Overview, Timeline, Pull Requests. The active tab shares the editor background and has a 1px accent line on top; inactive tabs are slightly darker. Tabs are client-side on one page: switching tabs never refetches data.
- Main area behaves like an open document: content starts at the top-left with a readable max width. Nothing centered, no hero styling.
- Status bar: 22px tall at the bottom. Text only.
- No activity bar and no decorative chrome.
- Under 768px the sidebar moves into a Sheet opened from a menu button in the title bar; tabs scroll horizontally.

## Color tokens (dark only)

Define as CSS variables and map shadcn's variables onto them. Values approximate VS Code Dark+.

- Backgrounds: --bg-editor #1e1e1e, --bg-sidebar #252526, --bg-titlebar #3c3c3c, --bg-tab #2d2d2d, --bg-status #007acc (text #ffffff)
- Lines and text: --border #3c3c3c, --fg #cccccc, --fg-muted #9d9d9d, --fg-strong #ffffff
- Interaction: --accent #0078d4, --link #3794ff, --hover #2a2d2e, --selected #094771, --focus #007fd4
- Semantic: --added #89d185, --removed #f14c4c, --warning #cca700, --merged #c586c0, --open #4ec9b0, --closed #f14c4c

Keep muted text at WCAG AA contrast or better.

## Type and density

- UI text: system stack (Segoe UI, system-ui, sans-serif), 13px base.
- Data (SHAs, PR and issue numbers, dates, counts, +/−): monospace stack (Cascadia Code, Consolas, ui-monospace, monospace). No web-font downloads.
- Rows 22–24px tall. 1px borders. Border radius 0–3px. No shadows except popovers. No gradients, glass or large rounded cards. Transitions at most 150ms, color only.
- Section headers: 11px, uppercase, letter-spaced, muted.

## Components

- Use shadcn/ui primitives restyled through the tokens. Add components one at a time with its CLI, only when a step needs them.
- Lists and trees: full-width rows with hover and selected backgrounds, like an editor's file explorer.
- Tables: dense, sticky header, numbers right-aligned in monospace, no zebra stripes, no card wrappers.
- Buttons: small and flat. Primary = accent fill. Everything else ghost or outline.
- Icons: lucide-react, 16px, paired with text or a tooltip, used sparingly.
- Focus: a visible 1px --focus outline (offset −1) on every interactive element. Everything is reachable by keyboard.
- Status tags: plain text with a colored dot or border, not filled pills.
- Charts (Recharts): flat, at most 4 colors from the tokens, muted monospace axes, subtle gridlines, no gradients or animation. Only when a chart shows something a table can't.
- Empty, loading and error states: plain muted text like the editor's Welcome page or Problems panel, saying what happened and what to do. Loading = a muted "Loading…" line or thin skeleton rows.

## Copy

Terse and literal: "Repository", "From", "To", "Load activity". No marketing tone, no exclamation marks, no emoji.

## Never

Hero sections, gradients, glassmorphism, big rounded cards, drop shadows, decorative illustrations, animation for its own sake, purple-and-blue SaaS palettes.
