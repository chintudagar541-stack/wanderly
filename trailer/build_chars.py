import re, pathlib
here = pathlib.Path(__file__).parent
old = (here/'../character-sheet/sheet.svg').read_text()
defs = re.search(r'<defs>(.*?)</defs>', old, re.S).group(1)
defs = re.sub(r'<clipPath.*?</clipPath>', '', defs, flags=re.S)
defs += (here/'chars_new.svgfrag').read_text()
(here/'chars_defs.svgfrag').write_text(defs)

cast = [("eirik","EIRIK","Stonehand",1.0),("sigrun","SIGRUN","Frostveil",1.0),("halvard","HALVARD","the Grey",1.0),
        ("tove","TOVE","the Scout",0.86),("ulfrik","JARL ULFRIK","Blackmane",1.04)]
W,H=1920,1080; ground=930
body=[]
for i,(cid,name,sub,s) in enumerate(cast):
    cx=192+384*i
    body.append(f'<ellipse cx="{cx}" cy="{ground+2}" rx="100" ry="11" fill="#d6cbb4"/>')
    body.append(f'<use href="#{cid}" transform="translate({cx},{ground}) scale({s*0.95})"/>')
    col = "#8f1d24" if cid=="ulfrik" else "#22181a"
    body.append(f'<text x="{cx}" y="{ground+60}" text-anchor="middle" font-family="Georgia,serif" font-size="30" font-weight="bold" fill="{col}">{name}</text>')
    body.append(f'<text x="{cx}" y="{ground+90}" text-anchor="middle" font-family="Georgia,serif" font-size="18" fill="#7a6a50" letter-spacing="2">{sub.upper()}</text>')
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><defs>{defs}</defs>
<rect width="{W}" height="{H}" fill="#f3efe6"/><rect width="{W}" height="{H}" fill="url(#grid)"/>
<text x="60" y="80" font-family="Georgia,serif" font-size="40" fill="#22181a" letter-spacing="3">WARRIORS OF THE NORTH</text>
<text x="60" y="114" font-family="Georgia,serif" font-size="18" fill="#c9a24a" letter-spacing="4">FULL CAST · ORIGINAL DESIGNS</text>
{''.join(body)}</svg>'''
(here/'cast-sheet.svg').write_text(svg)
