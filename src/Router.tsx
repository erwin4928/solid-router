import { Accessor, children, createContext, createMemo, createRenderEffect, createSignal, getOwner, JSX, on, onCleanup, ParentComponent, resetErrorBoundaries, runWithOwner, startTransition, untrack, useContext } from 'solid-js'
import { delegateEvents } from 'solid-js/web'

import {
  RouteDefinition,
  URLParams,
  Params,
  State,
  Branch,
  Match,
  Intent,
  NavigateOptions,
  Matcher,
} from './types'
import { create_matcher } from './match'

export interface RouterContext {
  is_routing: Accessor<boolean>
  intent: Accessor<Intent>
  state: [Accessor<State>, (state: unknown) => void]
  pathname: [Accessor<string>, (pathname: string) => void]
  search: [Accessor<string>, (search: string) => void]
  search_params: [Accessor<Params>, (params: Params) => void]
  hash: [Accessor<string>, (hash: string) => void]
  url_params: [Accessor<URLParams>, (params: Params) => void]
  navigate(url: string, options?: NavigateOptions): void
  navigate(delta: number): void
}

export let RouterContext = createContext<RouterContext>()

export let use_router = () => {
  let ctx = useContext(RouterContext)

  if (!ctx) {
    throw new Error()
  }

  return ctx
}

export interface RouteContext {
  is_routing: Accessor<boolean>
  intent: Accessor<Intent>
  state: [Accessor<State>, (state: unknown) => void]
  pathname: [Accessor<string>, (pathname: string) => void]
  search: [Accessor<string>, (search: string) => void]
  search_params: [Params, (params: Params) => void]
  hash: [Accessor<string>, (hash: string) => void]
  url_params: [URLParams, (params: Params) => void]
  component: Accessor<() => JSX.Element>
}

export let RouteContext = createContext<RouteContext>()

export let use_route = () => {
  let ctx = useContext(RouteContext)

  if (ctx == undefined) {
    throw new Error()
  }

  return ctx
}

export let Router: ParentComponent = (props) => {
  let [is_routing, set_is_routing] = createSignal(false)
  let [intent, set_intent] = createSignal<Intent>('navigate')

  let [pathname, set_pathname] = createSignal(extract_pathname(location.pathname))
  let [initial_search, initial_search_params] = extract_search(location.search)
  let [search, set_search] = createSignal(initial_search)
  let [search_params, set_search_params] = createSignal(initial_search_params)
  let [hash, set_hash] = createSignal(extract_hash(location.hash))

  navigate(get_state(), pathname() + search() + hash(), true)

  let [state, set_state] = createSignal(get_state(), {
    equals: (prev, next) => prev.solidRouter.version == next.solidRouter.version && prev.solidRouter.depth == next.solidRouter.depth,
  })

  let route_defs = children(() => props.children) as () => RouteDefinition | RouteDefinition[] | undefined
  let branches = createMemo(() => {
    let defs = route_defs()

    if (!defs) {
      return []
    }

    if (!Array.isArray(defs)) {
      defs = [defs]
    }

    return create_branches(defs)
  })

  let [match, set_match] = createSignal(match_branches(pathname(), branches()), {
    equals: (prev, next) => {
      if (prev && next) {
        return prev.branch == next.branch
      }

      return false
    },
  })

  createRenderEffect(on(() => branches(), (branches) => {
    set_is_routing(true)

    startTransition(() => {
      set_match(match_branches(pathname(), branches))

      resetErrorBoundaries()
    }).finally(() => set_is_routing(false))
  }, { defer: true }))

  let ctx: RouterContext = {
    is_routing,
    intent,
    state: [state, next => untrack(() => {
      let next_state = state()

      next_state.solidRouter.version++
      next_state.solidRouter.state = next

      navigate(next_state, pathname() + search() + hash(), true).then(() => {
        startTransition(() => {
          set_intent('internal')
          set_state(get_state())
          resetErrorBoundaries()
        })
      })
    })],
    pathname: [pathname, value => untrack(() => {
      let next_pathname = extract_pathname(value)

      if (next_pathname[0] != '/') {
        next_pathname = pathname().replace(last_segment_regex, next_pathname)
      }

      if (next_pathname == pathname()) {
        return
      }

      navigate(state(), next_pathname + search() + hash(), true).then(() => {
        startTransition(() => {
          set_intent('internal')
          set_pathname(next_pathname)
          set_match(match_branches(next_pathname, branches()))

          resetErrorBoundaries()
        })
      })
    })],
    search: [search, value => untrack(() => {
      let [next_search, next_search_params] = extract_search(value)

      if (next_search == search()) {
        return
      }

      navigate(state(), pathname() + next_search + hash(), true).then(() => {
        startTransition(() => {
          set_intent('internal')
          set_search(next_search)
          set_search_params(next_search_params)

          resetErrorBoundaries()
        })
      })
    })],
    hash: [hash, value => untrack(() => {
      let next_hash = extract_hash(value)

      if (next_hash == hash()) {
        return
      }

      navigate(state(), pathname() + search() + next_hash, true).then(() => {
        startTransition(() => {
          set_intent('internal')
          set_hash(next_hash)

          resetErrorBoundaries()
        })
      })
    })],
    url_params: [createMemo(() => match()?.params || {}), next => untrack(() => {
      let match_ = match()

      if (!match_?.branch.param_defs) {
        return
      }

      let all_params = { ...match_.params, ...next }
      let next_pathname = ''

      for (let param_def of match_.branch.param_defs) {
        if (param_def.static) {
          next_pathname += '/' + param_def.name

          continue
        }

        let value = all_params[param_def.name]

        if (!value) {
          if (!param_def.optional) {
            return
          }

          break
        }

        if (param_def.wild) {
          if (!Array.isArray(value)) {
            value = [value]
          }

          if (param_def.nextWild && value.length > 1) {
            next_pathname += '/' + value[0]
          }
          else {
            next_pathname += '/' + value.join('/')
          }
        }
        else {
          if (Array.isArray(value)) {
            next_pathname += '/' + value[0]
          }
          else {
            next_pathname += '/' + value
          }
        }
      }

      if (!next_pathname) {
        next_pathname = '/'
      }

      if (next_pathname == pathname()) {
        return
      }

      navigate(state(), next_pathname + search() + hash(), true).then(() => {
        startTransition(() => {
          set_intent('internal')
          set_pathname(next_pathname)
          set_match(match_branches(next_pathname, branches()))

          resetErrorBoundaries()
        })
      })
    })],
    search_params: [search_params, value => untrack(() => {
      let [next_search, next_search_params] = extract_search(value)

      if (next_search == search()) {
        return
      }

      navigate(state(), pathname() + next_search + hash(), true).then(() => {
        startTransition(() => {
          set_intent('internal')
          set_search(next_search)
          set_search_params(next_search_params)

          resetErrorBoundaries()
        })
      })
    })],
    navigate: (url_delta, options?: NavigateOptions) => untrack(() => {
      if (typeof url_delta == 'number') {
        navigate(url_delta) // popstate

        return
      }

      let next_pathname = extract_pathname(url_delta)
      let next_search: string
      let next_search_params: Params
      let next_hash = extract_hash(url_delta)

      if (options?.search_params) {
        next_search = build_search(options.search_params)
        next_search_params = options.search_params
      }
      else {
        let [a, b] = extract_search(url_delta)

        next_search = a
        next_search_params = b
      }

      if (next_pathname + next_search + next_hash == pathname() + search() + hash()) {
        if (options?.state === undefined) {
          return
        }

        options ??= {}
        options.replace = true
      }

      let next_state: State

      if (options?.replace) {
        next_state = state()

        if (options?.state !== undefined) {
          next_state.solidRouter.version++
          next_state.solidRouter.state = options.state
        }
      }
      else {
        next_state = {
          solidRouter: {
            version: 0,
            state: options?.state,
            pathname: next_pathname,
            depth: state().solidRouter.depth + 1,
            referrer: pathname(),
          },
        }

        next_state.solidRouter.pathname = next_pathname
        next_state.solidRouter.depth++
        next_state.solidRouter.referrer = pathname()
      }

      navigate(next_state, url_delta, options?.replace).then(() => {
        next_state = get_state()

        set_is_routing(true)

        startTransition(() => {
          set_intent('navigate')

          if (next_pathname != pathname()) {
            set_pathname(next_pathname)
            set_match(match_branches(next_pathname, branches()))
          }

          if (next_search != search()) {
            set_search(next_search)
            set_search_params(next_search_params)
          }

          if (next_hash != hash()) {
            set_hash(next_hash)
          }

          if (options?.state !== undefined || !options?.replace) {
            set_state(next_state)
          }
        }).finally(() => set_is_routing(false))
      })
    }),
  }

  let popstate = () => {
    let next_pathname = extract_pathname(location.pathname)
    let [next_search, next_search_params] = extract_search(location.search)
    let next_hash = extract_hash(location.hash)
    let next_state = get_state()

    startTransition(() => {
      set_intent('popstate')

      if (next_pathname != pathname()) {
        set_pathname(next_pathname)
        set_match(match_branches(next_pathname, branches()))
      }

      if (next_search != search()) {
        set_search(next_search)
        set_search_params(next_search_params)
      }

      if (next_hash != hash()) {
        set_hash(next_hash)
      }

      set_state(next_state)

      resetErrorBoundaries()
    })
  }

  window.addEventListener('popstate', popstate)

  onCleanup(() => {
    window.removeEventListener('popstate', popstate)
  })

  setup_anchor_events(ctx)

  let matched_branches = createMemo(() => {
    let leaf = match()

    if (!leaf) {
      return []
    }

    let branch = leaf.branch
    let matched_branches: Branch[] = []

    if (branch.route_def.component) {
      matched_branches.unshift(branch)
    }

    while (branch.parent) {
      if (branch.parent.route_def.component) {
        matched_branches.unshift(branch.parent)
      }

      branch = branch.parent
    }

    return matched_branches
  })

  let root_component = createMemo(() => matched_branches()[0]?.route_def.component)

  return (
    <RouterContext.Provider value={ctx}>
      <Child branches={matched_branches()} key={0} component={root_component() || (() => null)} />
    </RouterContext.Provider>
  )
}

type ChildProps = {
  branches: Branch[]
  key: number
  component: () => JSX.Element
}

let Child = (props: ChildProps) => {
  let router = use_router()

  let child_component = createMemo(() => props.branches[props.key + 1]?.route_def.component)

  let cache: Partial<Omit<RouteContext, 'component' | 'children'>> = {}

  let ctx: RouteContext = {
    get is_routing() {
      return cache.is_routing || (cache.is_routing = lock(router.is_routing, child_component))
    },
    get intent() {
      return cache.intent || (cache.intent = lock(router.intent, child_component))
    },
    get state() {
      return cache.state || (cache.state = [lock(router.state[0], child_component), router.state[1]])
    },
    get pathname() {
      return cache.pathname || (cache.pathname = [lock(router.pathname[0], child_component), router.pathname[1]])
    },
    get search() {
      return cache.search || (cache.search = [lock(router.search[0], child_component), router.search[1]])
    },
    get search_params() {
      return cache.search_params || (cache.search_params = [untrack(() => create_params(lock(router.search_params[0], child_component))), router.search_params[1]])
    },
    get hash() {
      return cache.hash || (cache.hash = [lock(router.hash[0], child_component), router.hash[1]])
    },
    get url_params() {
      return cache.url_params || (cache.url_params = [untrack(() => create_params(lock(router.url_params[0], child_component))), router.url_params[1]])
    },
    component: () => {
      let component = child_component()

      return () => <Child branches={props.branches} key={props.key + 1} component={component || (() => null)} />
    },
  }

  return (
    <RouteContext.Provider value={ctx}>
      <props.component />
    </RouteContext.Provider>
  )
}

function lock<T>(value: Accessor<T>, lock: Accessor<unknown>): Accessor<T> {
  let prev_lock: unknown

  return createMemo<T>((prev_value) => {
    if (prev_lock == lock()) {
      return prev_value
    }

    prev_lock = lock()

    return value()
  }, value())
}

function create_params<P extends Params | URLParams>(params: Accessor<P>): P {
  let owner = getOwner()

  if (owner == null) {
    throw new Error()
  }

  let map = new Map()

  let proxy = new Proxy(params(), {
    get(_, property) {
      if (typeof property != 'string') {
        throw new Error()
      }

      if (!map.has(property)) {
        runWithOwner(owner, () =>
          map.set(
            property,
            createMemo(() => {
              let value = params()[property]

              return value
            }, undefined, {
              equals: (prev, next) => {
                if (Array.isArray(prev) && Array.isArray(next)) {
                  if (next.length != prev.length) {
                    return false
                  }

                  for (let k = 0; k < prev.length; k++) {
                    if (prev[k] != next[k]) {
                      return false
                    }
                  }

                  return true
                }

                return prev == next
              },
            }),
          ),
        )
      }

      return map.get(property)()
    },
    getOwnPropertyDescriptor() {
      return {
        enumerable: true,
        configurable: true,
      }
    },
    ownKeys() {
      return Reflect.ownKeys(params())
    },
  })

  return proxy
}

let get_state = (depth?: number): State => {
  let state: State = history.state

  if (state !== null && typeof state == 'object' && 'solid-router' in state) {
    return state
  }

  return {
    solidRouter: {
      version: 0,
      pathname: extract_pathname(location.pathname),
      state,
      depth: depth || 0,
    },
  }
}

let double_slash_regex = /\/\/+/g
let trailing_slash_regex = /\/$/
let pathname_regex = /^(?:http:\/\/[^/]*)?([^?#]*)(?:\?|#)?/
let last_segment_regex = /[^/]*$/

let extract_pathname = (url: string) => {
  let match = url.match(pathname_regex)

  if (!match) {
    return '/'
  }

  return match[1].replaceAll(double_slash_regex, '/').replace(trailing_slash_regex, '')
}

let search_regex = /\?+[^?#]*/
let param_regex = /([^?#&=]+)=([^?#&=]+)/g

function extract_search(url: string): [string, Params]
function extract_search(params: Params): [string, Params]
function extract_search(url_params: string | Params): [string, Params] {
  if (typeof url_params == 'string') {
    let match = url_params.match(search_regex)

    if (!match) {
      return ['', {}]
    }

    let search = ''
    let params: Params = {}
    let match_arr = match[0].matchAll(param_regex)

    for (let match of match_arr) {
      let key = match[1]
      let value = match[2]
      let prev = params[key]

      if (search) {
        search += '&'
      }

      search += `${key}=${value}`

      if (prev) {
        if (!Array.isArray(prev)) {
          params[key] = [prev, value]
        }
        else {
          prev.push(value)
        }
      }
      else {
        params[key] = value
      }
    }

    return ['?' + search, params]
  }

  let search = ''
  let params: Params = {}

  for (let param in url_params) {
    let value = url_params[param]

    if (!value) {
      continue
    }

    params[param] = value

    if (Array.isArray(value)) {
      for (let v of value) {
        if (search.length) {
          search += '&'
        }

        search += `${param}=${v}`
      }
    }
    else {
      if (search.length) {
        search += '&'
      }

      search += `${param}=${value}`
    }
  }

  if (search.length) {
    search = '?' + search
  }

  return [search, params]
}

let build_search = (params: Params): string => {
  let search = ''

  for (let param in params) {
    let value = params[param]

    if (!value) {
      continue
    }

    if (Array.isArray(value)) {
      for (let v of value) {
        if (search.length) {
          search += '&'
        }

        search += `${param}=${v}`
      }
    }
    else {
      if (search.length) {
        search += '&'
      }

      search += `${param}=${value}`
    }
  }

  if (search.length) {
    search = '?' + search
  }

  return search
}

let hash_regex = /#[^#]+/

let extract_hash = (url: string) => {
  let match = url.match(hash_regex)

  if (!match) {
    return ''
  }

  return match[0]
}

let create_branches = (
  route_defs: RouteDefinition[],
  parent?: Branch,
): Branch[] => {
  let branches: Branch[] = []

  for (let def of route_defs) {
    let pattern = ''

    if (def.path) {
      pattern = def.path.slice(1)
    }

    if (parent?.pattern) {
      if (pattern) {
        pattern = `${parent.pattern}/${pattern}`
      }
      else {
        pattern = parent.pattern
      }
    }

    let matcher: Matcher | undefined

    if (pattern) {
      matcher = create_matcher(pattern)
    }

    let branch: Branch = {
      pattern,
      weight: matcher?.weight || 0,
      param_defs: matcher?.param_defs || [],
      route_def: def,
      parent,
      match: (path) => {
        if (!matcher) {
          return { params: {}, branch }
        }

        let params = matcher.match(path)

        if (!params) {
          return null
        }

        return { params, branch }
      },
    }

    let low = 0
    let high = branches.length
    let mid: number

    while (low < high) {
      mid = (low + high) >>> 1

      if (branches[mid].weight >= branch.weight) {
        low = mid + 1
      }
      else {
        high = mid
      }
    }

    if (def.children) {
      branches.splice(low, 0, ...create_branches(def.children, branch), branch)
    }
    else {
      branches.splice(low, 0, branch)
    }
  }

  return branches
}

function match_branches(path: string, branches: Branch[]): Match | null {
  path = path.slice(1)

  for (let branch of branches) {
    let result = branch.match(path)

    if (result) {
      return result
    }
  }

  return null
}

function setup_anchor_events(router: RouterContext) {
  function handle_anchor_click(e: MouseEvent) {
    if (
      e.defaultPrevented
      || e.button !== 0
      || e.metaKey
      || e.altKey
      || e.ctrlKey
      || e.shiftKey
    ) {
      return
    }

    let a = e
      .composedPath()
      .find(el => el instanceof Node && el.nodeName.toUpperCase() === 'A') as
      | HTMLAnchorElement
      | SVGAElement
      | undefined

    if (!a) {
      return
    }

    let svg = a.namespaceURI === 'http://www.w3.org/2000/svg'
    let href = svg ? (a as SVGAElement).href.baseVal : String(a.href)
    let target = svg ? (a as SVGAElement).target.baseVal : String(a.target)

    if (target || (!href && !a.hasAttribute('state'))) {
      return
    }

    let rel = (a.getAttribute('rel') || '').split(/\s+/)

    if (a.hasAttribute('download') || (rel && rel.includes('external'))) {
      return
    }

    let url = svg ? new URL(href, document.baseURI) : new URL(href)

    if (url.origin !== window.location.origin) {
      return
    }

    e.preventDefault()

    router.navigate(url.pathname + url.search + url.hash, {
      state: a.hasAttribute('state') && JSON.parse(a.getAttribute('state')!) || undefined,
      replace: a.hasAttribute('replace'),
    })
  }

  // ensure delegated event runs first
  delegateEvents(['click'])

  document.addEventListener('click', handle_anchor_click)

  onCleanup(() => {
    document.removeEventListener('click', handle_anchor_click)
  })
}

let navigate_buffer: { resolve: () => void, state_delta?: unknown | number, url?: string, replace?: boolean }[] = []
let navigate_timeout: number | undefined

function navigate(state?: unknown, url?: string, replace?: boolean): Promise<void>
function navigate(delta: number): Promise<void>
function navigate(state_delta?: unknown | number, url?: string, replace?: boolean): Promise<void> {
  if (navigate_timeout) {
    let resolve: () => void
    let promise = new Promise<void>(res => resolve = res)

    navigate_buffer.push({ resolve: resolve!, state_delta, url, replace })

    return promise
  }

  if (typeof state_delta == 'number') {
    history.go(state_delta)
  }
  else {
    if (!url) {
      url == location.pathname + location.search + location.hash

      replace = true
    }

    if (replace) {
      history.replaceState(state_delta, '', url)
    }
    else {
      history.pushState(state_delta, '', url)
    }
  }

  navigate_timeout = setTimeout(() => {
    navigate_timeout = undefined

    let next = navigate_buffer.shift()

    if (!next) {
      return
    }

    let { resolve, state_delta, url, replace } = next

    navigate(state_delta, url, replace)

    resolve()
  }, 10)

  return Promise.resolve()
}
