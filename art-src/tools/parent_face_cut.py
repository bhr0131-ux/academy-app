# 엄마·아빠 관리 헤더 아이콘 — 아이 화면 엄마모드/아빠모드 동그란 버튼 원화에서 인물만 떼어 낸다 (2026-11-26)
# 실행: 저장소 맨 위에서 python3 art-src/tools/parent_face_cut.py → public/assets/parent-face-mom.webp / -dad.webp
import sys
from PIL import Image, ImageFilter
from collections import deque
def cut(src, box, out, size=128, bgpt=None):
    im=Image.open(src).convert("RGBA").crop(box)
    W,H=im.size; px=im.load()
    # 배경색 = 위쪽 모서리 몇 군데 평균
    if bgpt:
        full=Image.open(src).convert("RGBA").load(); bx,by=bgpt
        samp=[full[bx+dx,by+dy] for dx in (-4,0,4) for dy in (-4,0,4)]
    else:
        samp=[px[x,y] for x,y in [(3,3),(W-4,3),(3,H//3),(W-4,H//3)]]
    bg=tuple(sum(c[i] for c in samp)//len(samp) for i in range(3))
    def near(c,t=46): return sum((c[i]-bg[i])**2 for i in range(3))<t*t and c[3]>0
    seen=[[False]*H for _ in range(W)]; q=deque()
    for x in range(W):
        for y in (0,H-1): q.append((x,y))
    for y in range(H):
        for x in (0,W-1): q.append((x,y))
    mask=Image.new("L",(W,H),255); mp=mask.load()
    while q:
        x,y=q.popleft()
        if x<0 or y<0 or x>=W or y>=H or seen[x][y]: continue
        seen[x][y]=True
        if not near(px[x,y]): continue
        mp[x,y]=0
        q.extend([(x+1,y),(x-1,y),(x,y+1),(x,y-1)])
    # 가장 큰 덩어리(사람)만 남긴다 — 모서리에 걸린 테두리 조각 제거
    lab=[[0]*H for _ in range(W)]; best=(0,0); cur=0
    for sx in range(W):
        for sy in range(H):
            if mp[sx,sy]==0 or lab[sx][sy]: continue
            cur+=1; n=0; st=[(sx,sy)]; lab[sx][sy]=cur
            while st:
                x,y=st.pop(); n+=1
                for nx,ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
                    if 0<=nx<W and 0<=ny<H and mp[nx,ny] and not lab[nx][ny]:
                        lab[nx][ny]=cur; st.append((nx,ny))
            if n>best[1]: best=(cur,n)
    for x in range(W):
        for y in range(H):
            if mp[x,y] and lab[x][y]!=best[0]: mp[x,y]=0
    mask=mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    im.putalpha(mask)
    bb=im.getbbox(); im=im.crop(bb)
    w,h=im.size; s=size/max(w,h); im=im.resize((max(1,round(w*s)),max(1,round(h*s))),Image.LANCZOS)
    canvas=Image.new("RGBA",(size,size),(0,0,0,0)); canvas.paste(im,((size-im.size[0])//2,(size-im.size[1])//2),im)
    canvas.save(out,"WEBP",quality=92,method=6)
    print(out, bg, canvas.size)
cut("art-src/btn-parent-badge-v4.webp",(195,95,510,445),"public/assets/parent-face-mom.webp",bgpt=(150,250))
cut("art-src/btn-parent-dad-badge-v1.webp",(370,150,840,760),"public/assets/parent-face-dad.webp")
