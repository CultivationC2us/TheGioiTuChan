import numpy as np
def rows(comps,n,tol=None):
    """gom theo hàng: n hàng theo trục y (kmeans 1D trên tâm y)"""
    cy=np.array([(c[1]+c[3])/2 for c in comps]);
    cs=np.linspace(cy.min(),cy.max(),n)
    for _ in range(30):
        a=np.abs(cy[:,None]-cs[None]).argmin(1)
        cs=np.array([cy[a==k].mean() if (a==k).any() else cs[k] for k in range(n)])
    out=[[] for _ in range(n)]
    for c,k in zip(comps,a): out[k].append(c)
    for r in out: r.sort(key=lambda c:c[0])
    return out
