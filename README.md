# Bryce's site — how to add content

This site is six plain pages (`index.html`, `sound.html`, `words.html`,
`pictures.html`, `the-index.html`, `quiet-room.html`) plus a `css/`
folder, a `js/` folder, and a `content/` folder. You will almost never
need to open the HTML, CSS, or JS files. Adding new content means
editing one of the three files in `content/`.

## Adding a journal entry (an essay / post)

Open `content/journal.json` in GitHub's editor (click the file, then
the pencil icon). You'll see blocks like this:

```json
{
  "date": "2026-09-14",
  "title": "On Buying the Same Notebook Again",
  "summary": "A confession, with receipts.",
  "tag": "Pens & paper"
}
```

To add a new entry, copy one whole block (from `{` to `}`), paste it
either right after the opening `[` or right before the closing `]`,
add a comma after the `}` of whichever block comes right before your
new one, and change the four values to your own. Keep the date format
as `YYYY-MM-DD` — that's what keeps entries sorted newest-first
automatically. It shows up on both the Words page and the homepage
preview without touching anything else.

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
