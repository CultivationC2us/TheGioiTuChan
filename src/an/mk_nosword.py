src=open('an/make.py').read()
assert "if sword: draw_sword(cv,*sword)" in src
src=src.replace("if sword: draw_sword(cv,*sword)","pass").replace("'an/","'anh/").replace("f'an/","f'anh/")
g={};exec(src,g)
