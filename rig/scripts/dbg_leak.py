import sys, os, numpy as np; sys.path.insert(0, os.path.dirname(__file__))
from seglib import *
from scipy.sparse.csgraph import breadth_first_order
M = Mesh(); N = norm_coords(M)
c=np.array([0,1.465,-.03]); up=np.array([0,1.,0]); a=.03; L=.23; T=a+.07
d=N-c; t=d@up; lat=np.linalg.norm(d-np.outer(t,up),axis=1)
roi=(abs(t)<T)&(lat<L)
r=cut_masks(M,roi,roi&(t>a),roi&(t<-a),None)
bar=r["crossing"]; n=len(M.F); keep=~bar
G=sp.coo_matrix((np.ones(keep.sum()),(M.ea[keep],M.eb[keep])),shape=(n,n)).tocsr()
seedS=np.nonzero(roi&(t>a))[0]; seedT=np.nonzero(roi&(t<-a))[0]
print("cut perim",r["perimeter"],"crossing edges",int(bar.sum()))
nc,lab=sp.csgraph.connected_components(G,directed=False)
sl=set(lab[seedS]); tl=set(lab[seedT]); print("S comps",len(sl),"T comps",len(tl),"shared",sl&tl)
sh=list(sl&tl)
if sh:
    comp=sh[0]; idx=np.nonzero(lab==comp)[0]; print("shared comp size",len(idx))
    # BFS predecessor path from a S seed to nearest T seed
    src=[i for i in seedS if lab[i]==comp][0]
    order,pred=breadth_first_order(G,src,directed=False,return_predecessors=True)
    tt=set(seedT); goal=next(i for i in order if i in tt)
    path=[goal]
    while path[-1]!=src: path.append(pred[path[-1]])
    P=N[path[::max(1,len(path)//20)]]
    print("path len",len(path)); print(P.round(2).tolist())
