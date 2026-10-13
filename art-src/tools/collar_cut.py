"""칼라가 어깨끈 위로 보이게 — 옷마다 칼라 모양(윤곽선 포함)대로 끈 앞장을 지운다.

쓰는 법 (저장소 루트에서):
  python3 art-src/tools/collar_cut.py <끈 앞장 webp> <출력 접두어>
  예) python3 art-src/tools/collar_cut.py public/assets/avatar/back/pirate-backpack-strap-girl.webp \
        public/assets/avatar/back/pirate-backpack-strap
  → <접두어>-<key>-girl.webp 를 옷마다 만든다. 데이터엔 topVariant: { <top id>: { imgFront: ... } } 로 단다.
결과는 꼭 눈으로 확인할 것 — 끈 위치가 다르면 SEEDS(칼라 안쪽 한 점, 좌우)를 옮겨야 한다.
[2026-10-13] 해적 가방에서 처음 씀. 달빛 마법사는 칼라 대신 망토 모자 기준 — 모자 아랫주름선
(열마다 y382~399 에서 가장 어두운 점을 2차 곡선으로 맞춤, 왼 x430~485·오른 x535~598) 위쪽 망토를 지운다(magic_hood_mask). 남아 옷은 아래 BOY·boy_mask (후드·잎 칼라·목 링·열린 칼라). 앞장 대신 한 장짜리 가방(z 38)도 같은 마스크로 지우면 된다.
"""
import sys, numpy as np, cv2
from PIL import Image
P = 'public/assets/avatar/top/'
# 옷 그림: (top id, 파일 key, 칼라 안쪽 씨앗 점들, 이어 붙일 색 규칙, 규칙 반복 수)
GIRL = {
  'safari-outfit-girl':   ('top_vest',          'vest',     [(464,388),(560,388)], None, 0),
  'pirate-outfit-girl':   ('top_pirate',        'pirate',   [(464,385),(560,385)], 'light', 6),   # 흰 테두리 띠
  'space-suit-girl':      ('top_space',         'space',    [(464,385),(560,385)], None, 0),      # 목 링
  'picnic-outfit-girl':   ('top_picnic',        'picnic',   [(464,385),(560,385)], None, 0),
  'bakery-outfit-girl':   ('top_bakery_girl',   'bakery',   [(466,385),(560,384)], None, 0),
  'raincoat-girl':        ('top_raincoat_girl', 'raincoat', [(464,385),(560,385)], 'teal', 14),   # 청록 테두리
  'delivery-outfit-girl': ('top_delivery_girl', 'delivery', [(464,385),(560,385)], 'sailor', 14), # 세일러 줄무늬
}
TOL = 14
def magic_hood_mask():
  T = np.array(Image.open(P + 'magic-outfit-girl.webp').convert('RGBA')); L = T[:, :, :3].astype(int).sum(2)
  M = np.zeros((1024, 1024), bool)
  for lo, hi in [(430, 485), (535, 598)]:
    xs = np.arange(lo, hi + 1); ys = np.array([382 + int(np.argmin(L[382:400, x])) for x in xs])
    p = np.polyfit(xs, ys, 2)
    for x in range(lo - 12, hi + 8):
      M[340:int(round(np.polyval(p, min(max(x, lo), hi)))) + 2, x] = True
  M &= T[:, :, 3] > 0
  return cv2.GaussianBlur(M.astype(np.float32), (3, 3), 0.7)
def collar_mask(name, seeds, rule, iters):
  T = np.array(Image.open(P + name + '.webp').convert('RGBA'))
  rgb = np.ascontiguousarray(T[:, :, :3]); rgb[T[:, :, 3] < 128] = 0
  m = np.zeros((1026, 1026), np.uint8)
  for x, y in seeds:
    cv2.floodFill(rgb.copy(), m, (x, y), 0, (TOL,)*3, (TOL,)*3, 4 | cv2.FLOODFILL_MASK_ONLY | (255 << 8))
  M = m[1:-1, 1:-1] > 0
  def clip(a): a[:, :425] = False; a[:, 600:] = False; a[440:, :] = False; return a
  M = clip(M)
  c = T[:, :, :3].astype(int); r, g, b = c[..., 0], c[..., 1], c[..., 2]
  grow = {'light': c.sum(2) > 600, 'teal': (r < 140) & (g > 90) & (b > 100) & (b > r + 30),
          'sailor': ((b - r) < 92) & (c.sum(2) > 450)}.get(rule)
  for _ in range(iters):
    M2 = clip((cv2.dilate(M.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0) & (grow | M))
    if (M2 == M).all(): break
    M = M2
  M = cv2.morphologyEx(M.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
  M = (cv2.dilate(M, np.ones((5, 5), np.uint8)) > 0) & (T[:, :, 3] > 0)   # 바깥 윤곽선 2px 까지
  return cv2.GaussianBlur(M.astype(np.float32), (3, 3), 0.7)
# ── 남아 (2026-10-13) — 칼라 대신 후드(바다·번개)·잎 칼라(도토리)·목 링(우주)·열린 칼라(썸머).
#    boy_mask(name) 은 블러 전 bool 마스크. 정글·해적·기본은 칼라가 없어 그대로.
BOY = {'hoodie-boy': 'top_hoodie_mint', 'board-outfit-boy': 'top_board_boy', 'beach-outfit-boy': 'top_beach_boy',
       'acorn-outfit-boy': 'top_acorn', 'space-suit-boy': 'top_space'}
def flood(T,seeds,tol):
  rgb=np.ascontiguousarray(T[:,:,:3]); rgb[T[:,:,3]<128]=0
  m=np.zeros((1026,1026),np.uint8)
  for x,y in seeds: cv2.floodFill(rgb.copy(),m,(x,y),0,(tol,)*3,(tol,)*3,4|cv2.FLOODFILL_MASK_ONLY|(255<<8))
  return m[1:-1,1:-1]>0
def grow(M,cond,n,clip):
  for _ in range(n):
    M2=clip((cv2.dilate(M.astype(np.uint8),np.ones((3,3),np.uint8))>0)&(cond|M))
    if (M2==M).all(): break
    M=M2
  return M
def boy_mask(name):
  T=np.array(Image.open('public/assets/avatar/top/'+name+'.webp').convert('RGBA'))
  c=T[:,:,:3].astype(int); r,g,b=c[...,0],c[...,1],c[...,2]; a=T[:,:,3]>128
  Y=np.arange(1024)[:,None]; X=np.arange(1024)[None,:]
  def clip(M,ymax=470): M=M.copy(); M[:, :395]=False; M[:, 630:]=False; M[ymax:,:]=False; return M
  if name=='hoodie-boy':
    teal=a&(g>r+60)&(b>r+60)
    M=clip(teal&(Y<460)); M=grow(M,a&(c.sum(2)>560),4,clip)
  elif name=='board-outfit-boy':
    teal=a&(g>r+40)&(b>r+40)
    L=c.sum(2); xs=np.arange(420,616); ys=np.array([418+int(np.argmin(L[418:446,x])) for x in xs])
    ok=np.abs(ys-np.median(ys))<8
    for lo,hi in [(420,500),(500,616)]:
      s_=ok&(xs>=lo)&(xs<hi); p=np.polyfit(xs[s_],ys[s_],1)
      for x in range(lo,hi): pass
    seam=np.full(1024,0)
    for x in range(395,630):
      xx=min(max(x,420),615); s_=ok&(np.abs(xs-xx)<20); seam[x]=int(np.median(ys[s_]))+1 if s_.any() else 430
    M=a&(Y<=seam[None,:])&(Y>=385)
    M=clip(M)
  elif name=='beach-outfit-boy':
    M=clip(flood(T,[(475,420),(470,410),(560,420),(558,412)],14),465)
  elif name=='acorn-outfit-boy':
    green=a&(g>b+40)&(g>=r-10)
    M=clip(flood(T,[(440,420),(580,420),(470,410),(555,412)],22)|(green&(Y<470)))
    M=grow(M,green,8,clip)
  elif name=='space-suit-boy':
    M=clip(flood(T,[(455,412),(570,410),(500,425),(520,425)],20),440)
  M=cv2.morphologyEx(M.astype(np.uint8),cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
  M=(cv2.dilate(M,np.ones((5,5),np.uint8))>0)&(T[:,:,3]>0)
  return M

if __name__ == '__main__':
  F = np.array(Image.open(sys.argv[1]).convert('RGBA')); out = sys.argv[2]
  for name, (tid, key, seeds, rule, iters) in GIRL.items():
    M = collar_mask(name, seeds, rule, iters)
    C = F.copy(); C[:, :, 3] = (C[:, :, 3] * (1 - M)).astype(np.uint8)
    Image.fromarray(C).save(f'{out}-{key}-girl.webp', 'WEBP', quality=90)
    print(tid, f'{out}-{key}-girl.webp')
  C = F.copy(); C[:, :, 3] = (C[:, :, 3] * (1 - magic_hood_mask())).astype(np.uint8)
  Image.fromarray(C).save(f'{out}-magic-girl.webp', 'WEBP', quality=90); print('top_magic', f'{out}-magic-girl.webp')
