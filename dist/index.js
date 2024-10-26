import { createContext as G, createSignal as C, children as H, createMemo as P, createRenderEffect as ie, on as se, startTransition as $, resetErrorBoundaries as q, untrack as E, onCleanup as Q, useContext as X, getOwner as he, runWithOwner as ue, mergeProps as oe } from "solid-js";
import { createComponent as N, delegateEvents as ce } from "solid-js/web";
let fe = /(?:^|\/)(:?)([^*?{}/]+)(\*)?(\?)?(?:{(.+)}([a-z]*)?)?/g, me = /([^/]+)/g, ge = (r) => {
  let e = [], a, t = 0, i = 0;
  for (; a = fe.exec(r); ) {
    let [f, u, o, n, g, d, b] = a;
    !u && n && (n = ""), !u && d && (d = ""), i++, u || i++;
    let m = {
      name: o,
      static: !u,
      optional: !!g,
      wild: !!n,
      rightRequired: 0
    };
    d && (m.regex = new RegExp(d, b));
    let w = !1;
    for (let c = t - 1; c > -1; c--) {
      let v = e[c];
      !m.optional && !w && (v.rightRequired = ++v.rightRequired), v.optional && (w = !0), m.wild && !v.nextWild && (v.nextWild = m);
    }
    e[t++] = m;
  }
  return e.length ? { weight: i, param_defs: e, match: (f) => {
    let u = f.match(me);
    if (!u)
      return null;
    let o = 0, n = e[o], g = {};
    if (!n.wild && !n.nextWild && u.length > e.length)
      return null;
    for (let d = 0; d < u.length; d++) {
      if (u.length - 1 - d < n.rightRequired)
        return null;
      let b = u[d];
      if (n.static) {
        if (b != n.name)
          return null;
        n = e[++o];
        continue;
      }
      if (!n.wild) {
        if (n.regex)
          if (n.regex.global) {
            let c = Array.from(b.matchAll(n.regex));
            if (!c.length)
              return null;
            g[n.name] = c;
          } else {
            let c = b.match(n.regex);
            if (!c)
              return null;
            g[n.name] = c;
          }
        else
          g[n.name] = b;
        n = e[++o];
        continue;
      }
      let m;
      n.nextWild ? m = 0 : (m = u.length - 1 - d - (e.length - 1 - o), m < 0 && (m = 0));
      let w = new Array(m + 1);
      for (let c = 0; c < w.length; c++) {
        let v = u[d + c];
        if (n.regex && !n.regex.global) {
          let D = v.match(n.regex);
          if (!D)
            return null;
          w[c] = D;
        } else
          w[c] = v;
      }
      if (n.regex?.global) {
        let c = Array.from(w.join("/").matchAll(n.regex));
        if (!c.length)
          return null;
        g[n.name] = c;
      } else
        g[n.name] = w;
      d += w.length - 1, n = e[++o];
    }
    for (; n; )
      n.wild, g[n.name] = null, n = e[++o];
    return g;
  } } : { weight: i, param_defs: e, match: () => null };
}, Y = G(), Z = () => {
  let r = X(Y);
  if (!r)
    throw new Error();
  return r;
}, ee = G(), A = () => {
  let r = X(ee);
  if (r == null)
    throw new Error();
  return r;
}, $e = (r) => {
  let [e, a] = C(!1), [t, i] = C("navigate"), [s, f] = C(j(location.pathname)), [u, o] = O(location.search), [n, g] = C(u), [d, b] = C(o), [m, w] = C(I(location.hash));
  k(U(), s() + n() + m(), !0);
  let [c, v] = C(U(), {
    equals: (h, l) => h.solidRouter.version == l.solidRouter.version && h.solidRouter.depth == l.solidRouter.depth
  }), D = H(() => r.children), L = P(() => {
    let h = D();
    return h ? (Array.isArray(h) || (h = [h]), re(h)) : [];
  }), [M, W] = C(S(s(), L()), {
    equals: (h, l) => h && l ? h.branch == l.branch : !1
  });
  ie(se(() => L(), (h) => {
    a(!0), $(() => {
      W(S(s(), h)), q();
    }).finally(() => a(!1));
  }, {
    defer: !0
  }));
  let V = {
    is_routing: e,
    intent: t,
    state: [c, (h) => E(() => {
      let l = c();
      l.solidRouter.version++, l.solidRouter.state = h, k(l, s() + n() + m(), !0).then(() => {
        $(() => {
          i("internal"), v(U()), q();
        });
      });
    })],
    pathname: [s, (h) => E(() => {
      let l = j(h);
      l[0] != "/" && (l = s().replace(xe, l)), l != s() && k(c(), l + n() + m(), !0).then(() => {
        $(() => {
          i("internal"), f(l), W(S(l, L())), q();
        });
      });
    })],
    search: [n, (h) => E(() => {
      let [l, p] = O(h);
      l != n() && k(c(), s() + l + m(), !0).then(() => {
        $(() => {
          i("internal"), g(l), b(p), q();
        });
      });
    })],
    hash: [m, (h) => E(() => {
      let l = I(h);
      l != m() && k(c(), s() + n() + l, !0).then(() => {
        $(() => {
          i("internal"), w(l), q();
        });
      });
    })],
    url_params: [P(() => M()?.params || {}), (h) => E(() => {
      let l = M();
      if (!l?.branch.param_defs)
        return;
      let p = {
        ...l.params,
        ...h
      }, _ = "";
      for (let y of l.branch.param_defs) {
        if (y.static) {
          _ += "/" + y.name;
          continue;
        }
        let x = p[y.name];
        if (!x) {
          if (!y.optional)
            return;
          break;
        }
        y.wild ? (Array.isArray(x) || (x = [x]), y.nextWild && x.length > 1 ? _ += "/" + x[0] : _ += "/" + x.join("/")) : Array.isArray(x) ? _ += "/" + x[0] : _ += "/" + x;
      }
      _ || (_ = "/"), _ != s() && k(c(), _ + n() + m(), !0).then(() => {
        $(() => {
          i("internal"), f(_), W(S(_, L())), q();
        });
      });
    })],
    search_params: [d, (h) => E(() => {
      let [l, p] = O(h);
      l != n() && k(c(), s() + l + m(), !0).then(() => {
        $(() => {
          i("internal"), g(l), b(p), q();
        });
      });
    })],
    navigate: (h, l) => E(() => {
      if (typeof h == "number") {
        k(h);
        return;
      }
      let p = j(h), _, y, x = I(h);
      if (l?.search_params)
        _ = ye(l.search_params), y = l.search_params;
      else {
        let [ne, le] = O(h);
        _ = ne, y = le;
      }
      if (p + _ + x == s() + n() + m()) {
        if (l?.state === void 0)
          return;
        l ??= {}, l.replace = !0;
      }
      let R;
      l?.replace ? (R = c(), l?.state !== void 0 && (R.solidRouter.version++, R.solidRouter.state = l.state)) : (R = {
        solidRouter: {
          version: 0,
          state: l?.state,
          pathname: p,
          depth: c().solidRouter.depth + 1,
          referrer: s()
        }
      }, R.solidRouter.pathname = p, R.solidRouter.depth++, R.solidRouter.referrer = s()), k(R, h, l?.replace).then(() => {
        R = U(), a(!0), $(() => {
          i("navigate"), p != s() && (f(p), W(S(p, L()))), _ != n() && (g(_), b(y)), x != m() && w(x), (l?.state !== void 0 || !l?.replace) && v(R);
        }).finally(() => a(!1));
      });
    })
  }, z = () => {
    let h = j(location.pathname), [l, p] = O(location.search), _ = I(location.hash), y = U();
    $(() => {
      i("popstate"), h != s() && (f(h), W(S(h, L()))), l != n() && (g(l), b(p)), _ != m() && w(_), v(y), q();
    });
  };
  window.addEventListener("popstate", z), Q(() => {
    window.removeEventListener("popstate", z);
  }), Ae(V);
  let B = P(() => {
    let h = M();
    if (!h)
      return [];
    let l = h.branch, p = [];
    for (l.route_def.component && p.unshift(l); l.parent; )
      l.parent.route_def.component && p.unshift(l.parent), l = l.parent;
    return p;
  }), ae = P(() => B()[0]?.route_def.component);
  return N(Y.Provider, {
    value: V,
    get children() {
      return N(te, {
        get branches() {
          return B();
        },
        key: 0,
        get component() {
          return ae() || (() => null);
        }
      });
    }
  });
}, te = (r) => {
  let e = Z(), a = P(() => r.branches[r.key + 1]?.route_def.component), t = {}, i = {
    get is_routing() {
      return t.is_routing || (t.is_routing = K(e.is_routing, a));
    },
    get intent() {
      return t.intent || (t.intent = K(e.intent, a));
    },
    get state() {
      return t.state || (t.state = [K(e.state[0], a), e.state[1]]);
    },
    get pathname() {
      return t.pathname || (t.pathname = [K(e.pathname[0], a), e.pathname[1]]);
    },
    get search() {
      return t.search || (t.search = [K(e.search[0], a), e.search[1]]);
    },
    get search_params() {
      return t.search_params || (t.search_params = [E(() => J(K(e.search_params[0], a))), e.search_params[1]]);
    },
    get hash() {
      return t.hash || (t.hash = [K(e.hash[0], a), e.hash[1]]);
    },
    get url_params() {
      return t.url_params || (t.url_params = [E(() => J(K(e.url_params[0], a))), e.url_params[1]]);
    },
    component: () => {
      let s = a();
      return () => N(te, {
        get branches() {
          return r.branches;
        },
        get key() {
          return r.key + 1;
        },
        component: s || (() => null)
      });
    }
  };
  return N(ee.Provider, {
    value: i,
    get children() {
      return N(r.component, {});
    }
  });
};
function K(r, e) {
  let a;
  return P((t) => a == e() ? t : (a = e(), r()), r());
}
function J(r) {
  let e = he();
  if (e == null)
    throw new Error();
  let a = /* @__PURE__ */ new Map();
  return new Proxy(r(), {
    get(i, s) {
      if (typeof s != "string")
        throw new Error();
      return a.has(s) || ue(e, () => a.set(s, P(() => r()[s], void 0, {
        equals: (f, u) => {
          if (Array.isArray(f) && Array.isArray(u)) {
            if (u.length != f.length)
              return !1;
            for (let o = 0; o < f.length; o++)
              if (f[o] != u[o])
                return !1;
            return !0;
          }
          return f == u;
        }
      }))), a.get(s)();
    },
    getOwnPropertyDescriptor() {
      return {
        enumerable: !0,
        configurable: !0
      };
    },
    ownKeys() {
      return Reflect.ownKeys(r());
    }
  });
}
let U = (r) => {
  let e = history.state;
  return e !== null && typeof e == "object" && "solid-router" in e ? e : {
    solidRouter: {
      version: 0,
      pathname: j(location.pathname),
      state: e,
      depth: r || 0
    }
  };
}, _e = /\/\/+/g, pe = /\/$/, de = /^(?:http:\/\/[^/]*)?([^?#]*)(?:\?|#)?/, xe = /[^/]*$/, j = (r) => {
  let e = r.match(de);
  return e ? e[1].replaceAll(_e, "/").replace(pe, "") : "/";
}, we = /\?+[^?#]*/, ve = /([^?#&=]+)=([^?#&=]+)/g;
function O(r) {
  if (typeof r == "string") {
    let t = r.match(we);
    if (!t)
      return ["", {}];
    let i = "", s = {}, f = t[0].matchAll(ve);
    for (let u of f) {
      let o = u[1], n = u[2], g = s[o];
      i && (i += "&"), i += `${o}=${n}`, g ? Array.isArray(g) ? g.push(n) : s[o] = [g, n] : s[o] = n;
    }
    return ["?" + i, s];
  }
  let e = "", a = {};
  for (let t in r) {
    let i = r[t];
    if (i)
      if (a[t] = i, Array.isArray(i))
        for (let s of i)
          e.length && (e += "&"), e += `${t}=${s}`;
      else
        e.length && (e += "&"), e += `${t}=${i}`;
  }
  return e.length && (e = "?" + e), [e, a];
}
let ye = (r) => {
  let e = "";
  for (let a in r) {
    let t = r[a];
    if (t)
      if (Array.isArray(t))
        for (let i of t)
          e.length && (e += "&"), e += `${a}=${i}`;
      else
        e.length && (e += "&"), e += `${a}=${t}`;
  }
  return e.length && (e = "?" + e), e;
}, be = /#[^#]+/, I = (r) => {
  let e = r.match(be);
  return e ? e[0] : "";
}, re = (r, e) => {
  let a = [];
  for (let t of r) {
    let i = "";
    t.path && (i = t.path.slice(1)), e?.pattern && (i ? i = `${e.pattern}/${i}` : i = e.pattern);
    let s;
    i && (s = ge(i));
    let f = {
      pattern: i,
      weight: s?.weight || 0,
      param_defs: s?.param_defs || [],
      route_def: t,
      parent: e,
      match: (g) => {
        if (!s)
          return {
            params: {},
            branch: f
          };
        let d = s.match(g);
        return d ? {
          params: d,
          branch: f
        } : null;
      }
    }, u = 0, o = a.length, n;
    for (; u < o; )
      n = u + o >>> 1, a[n].weight >= f.weight ? u = n + 1 : o = n;
    t.children ? a.splice(u, 0, ...re(t.children, f), f) : a.splice(u, 0, f);
  }
  return a;
};
function S(r, e) {
  r = r.slice(1);
  for (let a of e) {
    let t = a.match(r);
    if (t)
      return t;
  }
  return null;
}
function Ae(r) {
  function e(a) {
    if (a.defaultPrevented || a.button !== 0 || a.metaKey || a.altKey || a.ctrlKey || a.shiftKey)
      return;
    let t = a.composedPath().find((n) => n instanceof Node && n.nodeName.toUpperCase() === "A");
    if (!t)
      return;
    let i = t.namespaceURI === "http://www.w3.org/2000/svg", s = i ? t.href.baseVal : String(t.href);
    if ((i ? t.target.baseVal : String(t.target)) || !s && !t.hasAttribute("state"))
      return;
    let u = (t.getAttribute("rel") || "").split(/\s+/);
    if (t.hasAttribute("download") || u && u.includes("external"))
      return;
    let o = i ? new URL(s, document.baseURI) : new URL(s);
    o.origin === window.location.origin && (a.preventDefault(), r.navigate(o.pathname + o.search + o.hash, {
      state: t.hasAttribute("state") && JSON.parse(t.getAttribute("state")) || void 0,
      replace: t.hasAttribute("replace")
    }));
  }
  ce(["click"]), document.addEventListener("click", e), Q(() => {
    document.removeEventListener("click", e);
  });
}
let F = [], T;
function k(r, e, a) {
  if (T) {
    let t, i = new Promise((s) => t = s);
    return F.push({
      resolve: t,
      state_delta: r,
      url: e,
      replace: a
    }), i;
  }
  return typeof r == "number" ? history.go(r) : (e || (a = !0), a ? history.replaceState(r, "", e) : history.pushState(r, "", e)), T = setTimeout(() => {
    T = void 0;
    let t = F.shift();
    if (!t)
      return;
    let {
      resolve: i,
      state_delta: s,
      url: f,
      replace: u
    } = t;
    k(s, f, u), i();
  }, 10), Promise.resolve();
}
let Ee = (r) => {
  let e = H(() => r.children);
  return oe(r, {
    get children() {
      let a = e();
      return a && !Array.isArray(a) && (a = [a]), a;
    }
  });
}, Pe = () => A().is_routing, Ce = () => A().intent, qe = () => {
  let [r] = A().state;
  return P(() => r().solidRouter.depth);
}, Ke = () => {
  let [r] = A().state;
  return P(() => r().solidRouter.referrer);
}, Le = () => {
  let [r, e] = A().state;
  return [() => r().solidRouter.state, e];
}, Se = () => A().pathname, We = () => A().search, Ue = () => A().search_params, Oe = () => A().hash, je = () => A().url_params, Ne = () => Z().navigate, De = () => A().component;
export {
  Ee as Route,
  $e as Router,
  qe as use_depth,
  Oe as use_hash,
  Ce as use_intent,
  Pe as use_is_routing,
  Ne as use_navigate,
  De as use_outlet,
  je as use_params,
  Se as use_pathname,
  Ke as use_referrer,
  We as use_search,
  Ue as use_search_params,
  Le as use_state
};
//# sourceMappingURL=index.js.map
