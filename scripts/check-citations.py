"""Check the server-rendered citation contract in every owned built HTML page."""
from html.parser import HTMLParser
from pathlib import Path

EXCLUDED = []

class Page(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.meta = {}
        self.canonicals = []
        self.coins = False
        self.cites = 0
        self.in_head = False
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "head":
            self.in_head = True
        if tag == "meta" and self.in_head:
            key = a.get("name", a.get("property", ""))
            self.meta.setdefault(key, []).append(a.get("content", ""))
        if tag == "link" and a.get("rel") == "canonical":
            self.canonicals.append(a.get("href"))
        self.coins |= "Z3988" in (a.get("class") or "").split()
        self.cites += tag == "h2" and a.get("id") == "cite-h"

    def handle_endtag(self, tag):
        if tag == "head":
            self.in_head = False

files = [f for f in Path("dist").rglob("*.html") if not any(f.relative_to("dist").as_posix().startswith(p) for p in EXCLUDED)]
assert files, "Build the site first"
for f in files:
    p = Page(f.read_text())
    def one(key):
        values = p.meta.get(key, [])
        assert len(values) == 1 and values[0], f"{f}: {key}: {values}"
        return values[0]
    for key in ["citation_title", "citation_public_url", "citation_language", "DC.title", "DC.type", "DC.publisher", "DC.language", "og:site_name", "og:title", "og:url", "description"]:
        one(key)
    assert one("DC.type") in {"webpage", "blogPost", "bookSection", "book", "report"}, f
    assert p.canonicals == p.meta["citation_public_url"] == p.meta["og:url"], f"{f}: canonical mismatch"
    assert p.meta.get("citation_author") == p.meta.get("DC.creator"), f"{f}: author mismatch"
    assert p.meta.get("citation_author"), f"{f}: missing author"
    assert all("," in a for a in p.meta["citation_author"]), f"{f}: author order"
    assert one("DC.title") == one("citation_title") == one("og:title"), f"{f}: title mismatch"
    dates = p.meta.get("citation_publication_date", [])
    assert [d.replace("/", "-") for d in dates] == p.meta.get("DC.date", []), f"{f}: date mismatch"
    assert not p.coins and "citation_journal_title" not in p.meta, f"{f}: competing translator metadata"
    assert p.cites <= 1, f"{f}: duplicate visible citation"
print(f"PASS citation metadata: {len(files)} owned HTML pages; excluded: {EXCLUDED}")
