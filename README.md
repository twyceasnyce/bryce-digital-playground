# Bryce's site — how to add content

This site is seven plain pages (`index.html`, `sound.html`,
`words.html`, `pictures.html`, `the-index.html`, `quiet-room.html`,
and `post.html`, which displays whichever essay you clicked) plus a
`css/` folder, a `js/` folder, and a `content/` folder. You will
almost never need to open the HTML, CSS, or JS files. Adding new
content means editing the files inside `content/`.

## Adding a journal entry (an essay / post)

Every journal entry is two things: a short listing in
`content/journal.json`, and the actual essay text in its own file
inside `content/posts/`. Both are required — the listing is what
makes the entry show up in the list, and the file is what someone
actually reads when they click it.

**1. Add the listing.** Open `content/journal.json` in GitHub's editor
(click the file, then the pencil icon). You'll see blocks like this:

```json
{
  "date": "2026-09-14",
  "title": "On Buying the Same Notebook Again",
  "summary": "A confession, with receipts.",
  "tag": "Pens & paper",
  "slug": "on-buying-the-same-notebook-again"
}
```

Copy one whole block (from `{` to `}`), paste it either right after
the opening `[` or right before the closing `]`, add a comma after
the `}` of whichever block comes right before your new one, and change
the values to your own. Keep the date as `YYYY-MM-DD` — that's what
keeps entries sorted newest-first automatically. The `slug` is just
the file name for your essay, lowercase with hyphens instead of
spaces — it's what connects this listing to the actual text (next
step), and it's what shows up in the page's web address.

**2. Add the full text.** In `content/posts/`, create a new file named
exactly `<slug>.md` — so for the example above,
`content/posts/on-buying-the-same-notebook-again.md`. In GitHub, that's
"Add file" → "Create new file," type that name, and write the essay in
the box. Just write normally:

```
This is the first paragraph. Write it like you'd write anything else.

This is the second paragraph — a blank line is all it takes to start
a new one. No other formatting is required.

You can *italicize a word* like this, or **bold one** like this, if
you want to.
```

Commit it, and the entry is live — it appears in the journal list on
both the Words page and the homepage, and clicking it shows this full
text on its own page.

**To feature an entry at the top of the Words page** (the big excerpt,
instead of just a line in the list), add `"featured": true` to that
entry in `journal.json`. Only put it on one entry at a time — remove
it from the old one when you add it to a new one, or the page just
picks whichever comes first.

## Adding a track (a song)

Same idea, in `content/tracks.json`:

```json
{ "title": "Slow Room", "tag": "Solo · sketch" }
```

Copy a block, paste it, add a comma, change `title` and `tag`. It
appears in the listening room on both the homepage and the Sound page,
and becomes pickable in the player automatically.

## Adding a photo

In `content/photos.json`, each entry is one frame in the contact
sheet on the Pictures page:

```json
{ "label": "16", "image": "" }
```

If you leave `"image": ""` it shows as a plain colored tile (a
placeholder). Once you have a real photo: upload the image file into
the `images/` folder, then put its file name in the `image` field,
like `"image": "images/my-photo.jpg"`.

## A couple of things worth knowing

- **Every value goes in double quotes**, and every block except the
  last one in a list needs a comma after it. If the site looks broken
  after an edit, this is almost always why — check for a missing
  comma or quote first.
- **Previewing on your own computer:** if you just double-click
  `index.html` to look at it before uploading, the Journal, Sound, and
  Pictures lists may look empty. That's a normal browser security rule
  about loading local files this way — it has nothing to do with your
  edit. Once the site is live on GitHub Pages, this isn't an issue.
- Everything else — the masthead, the ticker at the very top, the
  cover story, the manifesto text on the Quiet Room page — lives
  directly in the HTML files, since those change rarely. Ask me
  whenever you want to change one of those and I'll make the edit.
