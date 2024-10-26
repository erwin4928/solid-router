import type { JSX } from 'solid-js'

export interface State {
  solidRouter: {
    version: number
    state?: unknown
    pathname: string
    depth: number
    referrer?: string
  }
}

export type URLParams = Record<string, string | RegExpMatchArray | string[] | RegExpMatchArray[] | RegExpExecArray[] | null>

export type Params = Record<string, string | string[]>

export interface NavigateOptions {
  state?: unknown
  replace?: boolean
  search_params?: Params
}

export interface UpdateOptions extends NavigateOptions {
  url_delta?: string | number
  search_params?: Params
  match?: boolean
}

export type Intent = 'internal' | 'popstate' | 'navigate'

export type RouteDefinition = {
  path?: string
  children?: RouteDefinition[]
  component?: () => JSX.Element
}

export interface ParamDefinition {
  name: string
  static?: boolean
  wild?: boolean
  optional?: boolean
  regex?: RegExp
  rightRequired: number
  nextWild?: ParamDefinition
}

export interface Branch {
  pattern: string
  weight: number
  param_defs: ParamDefinition[]
  route_def: RouteDefinition
  parent?: Branch
  children?: Branch[]
  match: (path: string) => Match | null
}

export interface Matcher {
  weight: number
  param_defs: ParamDefinition[]
  match: (path: string) => URLParams | null
}

export interface Match {
  params: URLParams
  branch: Branch
}
