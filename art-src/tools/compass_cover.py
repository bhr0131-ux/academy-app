import sys, numpy as np
from PIL import Image, ImageFilter
src, out, pv = sys.argv[1], sys.argv[2], sys.argv[3]
im=Image.open(src).convert("RGB"); A=np.asarray(im).astype(np.float64); H,W,_=A.shape
# 나침반이 있는 왼쪽 위 상자 (원화 px) — 두 지도 모두 이 범위 안
x0,y0,x1,y1=int(W*0.035),int(H*0.027),int(W*0.30),int(H*0.132)
R=A[y0:y1,x0:x1].copy(); h,w,_=R.shape
r,g,b=R[...,0],R[...,1],R[...,2]
lum=R.mean(-1); sat=R.max(-1)-R.min(-1)
# 배경: 밝고 거의 무채색(옅은 하늘·종이) — 나침반 선·글자는 갈색(채도↑, 밝기↓)
bgl=np.median(lum); fg=(sat>16)|(lum<bgl-10)
m=Image.fromarray((fg*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))
M=np.asarray(m)>0
# 가장자리는 채우지 않는다(바깥 경계 = 알려진 값)
M[:2,:]=M[-2:,:]=False; M[:,:2]=M[:,-2:]=False
F=R.copy()
known=~M
F[M]=R[known].mean(0)
for it in range(4000):   # 조화 보간(열 확산) — 둘레 색으로 매끈하게 메운다
    avg=(np.roll(F,1,0)+np.roll(F,-1,0)+np.roll(F,1,1)+np.roll(F,-1,1))/4
    F[M]=avg[M]
# 원래 배경의 아주 옅은 결(노이즈)을 살짝 얹어 너무 매끈해 보이지 않게
rng=np.random.default_rng(7); F[M]+=rng.normal(0,1.6,(M.sum(),3))
# 알파: 메운 자리만 + 가장자리 부드럽게
al=Image.fromarray((M*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(2.5))
P=Image.fromarray(np.clip(F,0,255).astype(np.uint8)).convert("RGBA"); P.putalpha(al)
P.save(out, quality=90)
print(f"box px {x0},{y0},{x1},{y1}  pct left={x0/W*100:.3f} top={y0/H*100:.3f} width={(x1-x0)/W*100:.3f}  masked={M.mean()*100:.1f}%")
# 미리보기: 원본 위에 패치 얹은 결과
comp=im.convert("RGBA"); comp.alpha_composite(P,(x0,y0))
comp.crop((0,0,int(W*0.45),int(H*0.2))).convert("RGB").save(pv)
