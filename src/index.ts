import { Accessor, createMemo } from 'solid-js'

import { Params } from './types'
import { use_router, use_route } from './Router'

export { Router } from './Router'
export { Route } from './Route'

export let use_is_routing = () => use_route().is_routing

export let use_intent = () => use_route().intent

export let use_depth = () => {
  let [state] = use_route().state

  return createMemo(() => state().solidRouter.depth)
}

export let use_referrer = () => {
  let [state] = use_route().state

  return createMemo(() => state().solidRouter.referrer)
}

export let use_state = <S = unknown>() => {
  let [state, set_state] = use_route().state

  return [() => state().solidRouter.state, set_state] as [Accessor<S>, (value: unknown) => void]
}

export let use_pathname = () => use_route().pathname

export let use_search = () => use_route().search

export let use_search_params = <P extends Params = Params>(): [P, (params: Partial<P>) => void] => use_route().search_params as unknown as [P, (params: Partial<P>) => void]

export let use_hash = () => use_route().hash

export let use_params = <P extends Params = Params>() => use_route().url_params as unknown as [P, (params: Partial<P>) => void]

export let use_navigate = () => use_router().navigate

export let use_outlet = () => use_route().component

declare module 'solid-js' {
  namespace JSX {
    interface AnchorHTMLAttributes<T> {
      state?: string
      replace?: boolean
    }
  }
}
