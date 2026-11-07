import pathlib
h=pathlib.Path(__file__).parent
js=(h/'trailer_base.js').read_text()+(h/'trailer_cam.js').read_text()
html=(h/'trailer_template.html').read_text().replace('%%CHARS%%',(h/'chars_defs.svgfrag').read_text()).replace('%%SCRIPT%%',js)
(h/'trailer.html').write_text(html)
