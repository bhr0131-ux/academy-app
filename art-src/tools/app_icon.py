"""미션팡 앱 아이콘 만들기 — 과녁 원화(art-src/app-icon-target-src.webp) → 안드로이드 아이콘 세트 + 스토어 512.

원화는 흰 바탕 위 '둥근 파란 네모' 그림이라 그대로 쓰면 런처 모양(동그라미·둥근 네모)에 따라
네모 테두리가 보이거나 별이 잘린다. 그래서
  1) 파란 배경의 그라데이션을 식(2차)으로 맞춰 108dp 판 전체를 같은 파랑으로 다시 칠하고,
  2) 원본에서는 '그림'(과녁·별·반짝이·그림자)만 가져와 얹는다 — 네모 이음새가 없다.
  3) 그림은 판의 62% 크기 → 과녁·별이 안전 영역(가운데 66dp 원) 안에 든다.
쓰는 법:  python3 -I art-src/tools/app_icon.py <원화> <출력폴더>
결과: <출력>/res/mipmap-*/ic_launcher{,_round,_foreground}.png, values/ic_launcher_background.xml,
      mipmap-anydpi-v26/*.xml, <출력>/play-store-icon-512.png
"""
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
import sys, os
SRC=sys.argv[1]; OUT=sys.argv[2]
im=Image.open(SRC).convert("RGB"); A=np.asarray(im).astype(np.float64)
H,W,_=A.shape
r,g,b=A[...,0],A[...,1],A[...,2]
blue=(b>r+80)&(b>g+30)
yy,xx=np.mgrid[0:H,0:W]
# 배경 파랑만: 과녁 원·별·화살 주변 제외
excl=((xx-595)**2+(yy-710)**2<380**2)|((xx>690)&(xx<1080)&(yy>140)&(yy<640))
inner=(xx>110)&(xx<1140)&(yy>95)&(yy<1150)
samp=blue&~excl&inner
# 색 차이 큰 점(반짝이·그림자) 제거 위해 2단계 맞춤
def design(x,y):
    x=x/W; y=y/H
    return np.stack([np.ones_like(x),x,y,x*x,y*y,x*y],-1)
X=design(xx[samp],yy[samp]); Y=A[samp]
coef,*_=np.linalg.lstsq(X,Y,rcond=None)
res=np.abs(X@coef-Y).sum(1); keep=res<np.percentile(res,90)
coef,*_=np.linalg.lstsq(X[keep],Y[keep],rcond=None)
print("fit err(mean abs):",np.abs(X[keep]@coef-Y[keep]).mean(0))

# 정사각 판(파란 네모) 위치
x0,x1,y0,y1=97,1156,81,1171
side=max(x1-x0,y1-y0); cx=(x0+x1)/2; cy=(y0+y1)/2

def layer(N, sq_frac):
    """N×N 캔버스. 파란 네모를 캔버스의 sq_frac 크기로 가운데 두고, 바깥은 같은 그라데이션으로 채운다."""
    s=side/(N*sq_frac)                       # 캔버스 1px = 원본 s px
    gy,gx=np.mgrid[0:N,0:N]
    ox=cx+(gx+0.5-N/2)*s; oy=cy+(gy+0.5-N/2)*s
    grad=design(ox,oy)@coef
    # 원본에서 샘플(양선형)
    big=im.resize((int(round(W/s)),int(round(H/s))),Image.LANCZOS)
    Bz=np.asarray(big).astype(np.float64)
    offx=int(round(N/2-cx/s)); offy=int(round(N/2-cy/s))
    canvas=grad.copy()
    hh,ww,_=Bz.shape
    ys0,xs0=max(0,offy),max(0,offx); ys1,xs1=min(N,offy+hh),min(N,offx+ww)
    orig=np.zeros_like(grad); orig[ys0:ys1,xs0:xs1]=Bz[ys0-offy:ys1-offy,xs0-offx:xs1-offx]
    # 네모 안쪽 마스크(둥근 모서리 + 테두리 안티앨리어싱 제외) → 부드럽게 섞기
    m=Image.new("L",(N,N),0); d=ImageDraw.Draw(m)
    L=N/2-side/s/2; R=N/2+side/s/2; rad=0.24*side/s; inset=0.07*side/s
    d.rounded_rectangle([L+inset,L+inset,R-inset,R-inset],radius=rad,fill=255)
    sq=np.asarray(m.filter(ImageFilter.GaussianBlur(0.025*side/s))).astype(np.float64)/255
    # 파란 배경은 전부 그라데이션으로 다시 칠하고, 원본에서는 '그림'(과녁·별·반짝이·그림자)만 가져온다
    diff=np.abs(orig-grad).sum(-1)
    cm=Image.fromarray(((diff>20)*255).astype(np.uint8))
    k=int(0.012*side/s)|1
    cm=cm.filter(ImageFilter.MaxFilter(k)).filter(ImageFilter.GaussianBlur(0.01*side/s))
    m=(np.asarray(cm).astype(np.float64)/255*sq)[...,None]
    out=orig*m+grad*(1-m)
    return Image.fromarray(np.clip(out,0,255).astype(np.uint8))

os.makedirs(OUT,exist_ok=True)
# 적응형 아이콘 한 장(108dp 전체) — 네모를 72% 크기로: 보이는 영역(66.7%)보다 커서 네모 테두리는 안 보이고,
# 과녁·별은 안전 영역 안에 든다
MASTER=layer(1728,float(os.environ.get("SQ","0.62")))
N=MASTER.size[0]; vis=N*72/108; o=(N-vis)/2
VIS=MASTER.crop((round(o),round(o),round(o+vis),round(o+vis)))    # 런처에 실제로 보이는 72dp 부분

def mask_img(img, size, shape):
    big=img.resize((size*4,size*4),Image.LANCZOS).convert("RGBA")
    m=Image.new("L",big.size,0); d=ImageDraw.Draw(m)
    if shape=="circle": d.ellipse([0,0,big.size[0]-1,big.size[1]-1],fill=255)
    else: d.rounded_rectangle([0,0,big.size[0]-1,big.size[1]-1],radius=int(big.size[0]*0.22),fill=255)
    big.putalpha(m); return big.resize((size,size),Image.LANCZOS)

DENS={"mdpi":1,"hdpi":1.5,"xhdpi":2,"xxhdpi":3,"xxxhdpi":4}
for name,k in DENS.items():
    d=f"{OUT}/res/mipmap-{name}"; os.makedirs(d,exist_ok=True)
    MASTER.resize((round(108*k),)*2,Image.LANCZOS).convert("RGBA").save(f"{d}/ic_launcher_foreground.png")
    leg=round(48*k); pad=round(leg*0.08); inner=leg-2*pad         # 옛 안드로이드(7 이하)용 — 템플릿처럼 둘레 여백
    for fn,shape in (("ic_launcher.png","round_rect"),("ic_launcher_round.png","circle")):
        c=Image.new("RGBA",(leg,leg),(0,0,0,0)); c.paste(mask_img(VIS,inner,shape),(pad,pad)); c.save(f"{d}/{fn}")
# 배경색 — 전경이 불투명이라 거의 안 보이지만, 런처가 잠깐 보여 줄 때 같은 파랑이 되게
mid=np.asarray(MASTER)[N//2-5:N//2+5, N//10:N//10+10].reshape(-1,3).mean(0).astype(int)
os.makedirs(f"{OUT}/res/values",exist_ok=True)
open(f"{OUT}/res/values/ic_launcher_background.xml","w").write(
  '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#%02X%02X%02X</color>\n</resources>\n'%tuple(mid))
os.makedirs(f"{OUT}/res/mipmap-anydpi-v26",exist_ok=True)
for fn in ("ic_launcher.xml","ic_launcher_round.xml"):
    open(f"{OUT}/res/mipmap-anydpi-v26/{fn}","w").write('<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/ic_launcher_background"/>\n    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n</adaptive-icon>\n')
# 스토어 아이콘 512 — 네모 그대로(모서리는 플레이스토어가 둥글린다), 불투명 32비트 PNG
VIS.resize((512,512),Image.LANCZOS).convert("RGBA").save(f"{OUT}/play-store-icon-512.png")
print("done", tuple(mid))
