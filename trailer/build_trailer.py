import pathlib
h=pathlib.Path(__file__).parent
html=(h/'trailer_template.html').read_text().replace('%%CHARS%%',(h/'chars_defs.svgfrag').read_text()).replace('%%SCRIPT%%',(h/'trailer.js').read_text())
(h/'trailer.html').write_text(html)
