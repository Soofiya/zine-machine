# Soof's Zine Machine

A little vending-machine-style website for browsing, reading and searching
Soof's Zine zines.

```
zine-machine/
├── index.html          the whole page — the machine itself
├── css/style.css        all the styling (cabinet, panels, stickers, texture)
├── js/script.js          all the behaviour (search, tags, viewer)
├── data/zines.json       ← EDIT TO ADD ZINES
├── assets/
│   ├── header.png        
│   └── texture.jpg       
└── zines/
    ├── run-zine/
    │   ├── run-1.png 
    │   ├── run-2.png 
    │   ├── run-3.png 
    │   └── run-4.png 
    ├── Choose-zine/...
    └── AF-Zine/...
```

---

## How to add a new zine (the only two steps)

### 1. Add your images

Inside the `zines/` folder, make a new folder named after your zine, using
lowercase letters and hyphens instead of spaces — this is called a "slug".

```
zines/my-new-zine/
```

Drop your JPEGs in there, in reading order, with a number at the front so
they always sort correctly:

```
zines/my-new-zine/01-cover.jpg
zines/my-new-zine/02-spread.jpg
zines/my-new-zine/03-spread.jpg
zines/my-new-zine/04-spread.jpg
zines/my-new-zine/05-back.jpg
```

You can have as many inner spread pages as you want — the reader just pages
through whatever's listed. Keep file sizes reasonable (under ~1.5MB per
image) so the site stays quick to load — most photo editors, Preview
(Mac) or even just re-saving as a JPEG at "medium" quality will do that.

### 2. Add an entry to `data/zines.json`

Open `data/zines.json` in any plain text editor (TextEdit, VS Code, Notepad
— anything that isn't Word). It's a list of zines, each one written like
this. Copy an existing entry, paste it, and change the details:

```json
{
  "slug": "my-new-zine",
  "title": "My New Zine",
  "year": "2026",
  "tags": ["comics", "brighton"],
  "blurb": "One or two sentences about what this zine is.",
  "cover": "zines/my-new-zine/01-cover.jpg",
  "pages": [
    "zines/my-new-zine/01-cover.jpg",
    "zines/my-new-zine/02-spread.jpg",
    "zines/my-new-zine/03-spread.jpg",
    "zines/my-new-zine/04-spread.jpg",
    "zines/my-new-zine/05-back.jpg"
  ]
}
```

A few rules that matter:

- Every entry needs a **comma** after its closing `}` — except the very
  last one in the list. This is the #1 thing that breaks JSON files.
- `tags` is a list — lowercase, no spaces (use hyphens: `"found-objects"`
  not `"found objects"`). Tags you reuse across zines automatically group
  together in the tag directory on the site, with a live count.
- `cover` should be the first image people see in the grid — usually your
  front cover.
- `pages` is the full reading order, cover to back, exactly matching the
  files you put in the folder.

Save the file, refresh the site, and your new zine appears in the library
— sorted newest year first automatically. No other file needs to change.

**Tip:** if you're ever unsure whether your edit to `zines.json` is valid,
paste the whole file into [jsonlint.com](https://jsonlint.com) and it'll
tell you exactly which line has a typo.

---