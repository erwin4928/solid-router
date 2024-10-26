import type { ParamDefinition, URLParams, Matcher } from './types'

export type Args<R extends string> =
  R extends `:${infer P}*?{${infer R}}${infer Flags}/${infer Rest}`
    ? { [K in P]?: RegexValue<Flags>[] } & Partial<Args<Rest>>
    : R extends `:${infer P}*{${infer R}}${infer Flags}/${infer Rest}`
      ? { [K in P]: RegexValue<Flags>[] } & Args<Rest>
      : R extends `:${infer P}?{${infer R}}${infer Flags}/${infer Rest}`
        ? { [K in P]?: RegexValue<Flags> } & Args<Rest>
        : R extends `:${infer P}{${infer R}}${infer Flags}/${infer Rest}`
          ? { [K in P]: RegexValue<Flags> } & Args<Rest>
          : R extends `:${infer P}*?/${infer Rest}`
            ? { [K in P]?: string[] } & Partial<Args<Rest>>
            : R extends `:${infer P}*/${infer Rest}`
              ? { [K in P]: string[] } & Args<Rest>
              : R extends `:${infer P}?/${infer Rest}`
                ? { [K in P]?: string } & Partial<Args<Rest>>
                : R extends `:${infer P}/${infer Rest}`
                  ? { [K in P]: string } & Args<Rest>
                  : R extends `:${infer P}*?{${infer R}}${infer Flags}`
                    ? { [K in P]?: RegexValue<Flags>[] }
                    : R extends `:${infer P}*{${infer R}}${infer Flags}`
                      ? { [K in P]: RegexValue<Flags>[] }
                      : R extends `:${infer P}?{${infer R}}${infer Flags}`
                        ? { [K in P]?: RegexValue<Flags> }
                        : R extends `:${infer P}{${infer R}}${infer Flags}`
                          ? { [K in P]: RegexValue<Flags> }
                          : R extends `:${infer P}*?`
                            ? { [K in P]?: string[] }
                            : R extends `:${infer P}*`
                              ? { [K in P]: string[] }
                              : R extends `:${infer P}?`
                                ? { [K in P]?: string }
                                : R extends `:${infer P}`
                                  ? { [K in P]: string }
                                  : {}

export type RegexValue<Flags> = Flags extends `${infer L}g${infer T}` ? RegExpExecArray : RegExpMatchArray

let params_regex = /(?:^|\/)(:?)([^*?{}/]+)(\*)?(\?)?(?:{(.+)}([a-z]*)?)?/g
let segments_regex = /([^/]+)/g

export let create_matcher = (route: string): Matcher => {
  let param_defs: ParamDefinition[] = []
  let matched: RegExpExecArray | null
  let pk = 0
  let weight = 0

  while (matched = params_regex.exec(route)) {
    let [_, not_static, name, wild, optional, regex, flags] = matched

    if (!not_static && !!wild) { // static and wild unsupported
      wild = ''
    }

    if (!not_static && regex) { // static and regex unsupported
      regex = ''
    }

    weight++

    if (!not_static) {
      weight++
    }

    let param: ParamDefinition = {
      name,
      static: !not_static,
      optional: !!optional,
      wild: !!wild,
      rightRequired: 0,
    }

    if (regex) {
      param.regex = new RegExp(regex, flags)
    }

    let stop = false

    for (let k = pk - 1; k > -1; k--) {
      let prev = param_defs[k]

      if (!param.optional && !stop) {
        prev.rightRequired = ++prev.rightRequired
      }

      if (prev.optional) {
        stop = true
      }

      if (param.wild && !prev.nextWild) {
        prev.nextWild = param
      }
    }

    param_defs[pk++] = param
  }

  if (!param_defs.length) {
    return { weight, param_defs, match: () => null }
  }

  let match = (path: string) => {
    let segments = path.match(segments_regex)

    if (!segments) {
      return null
    }

    let pk = 0
    let param: ParamDefinition | undefined = param_defs[pk]
    let args: URLParams = {}

    if (!param.wild && !param.nextWild) {
      if (segments.length > param_defs.length) {
        return null
      }
    }

    for (let k = 0; k < segments.length; k++) {
      if (segments.length - 1 - k < param!.rightRequired) { // rightRequired might change when encountering an optional param with additional params
        return null
      }

      let seg = segments[k]

      if (param!.static) {
        if (seg != param!.name) {
          return null
        }

        param = param_defs[++pk]

        continue
      }

      if (!param!.wild) {
        if (param.regex) {
          if (param.regex.global) {
            let match = Array.from(seg.matchAll(param.regex))

            if (!match.length) {
              return null
            }

            args[param.name] = match
          }
          else {
            let match = seg.match(param.regex)

            if (!match) {
              return null
            }

            args[param.name] = match
          }
        }
        else {
          args[param!.name] = seg
        }

        param = param_defs[++pk]

        continue
      }

      let right: number

      if (param!.nextWild) {
        right = 0
      }
      else {
        right = segments.length - 1 - k - (param_defs.length - 1 - pk)

        if (right < 0) {
          right = 0
        }
      }

      let wild_args = new Array<string | RegExpMatchArray>(right + 1)

      for (let wk = 0; wk < wild_args.length; wk++) {
        let seg = segments[k + wk]

        if (param.regex && !param.regex.global) {
          let match = seg.match(param.regex)

          if (!match) {
            return null
          }

          wild_args[wk] = match
        }
        else {
          wild_args[wk] = seg
        }
      }

      if (param.regex?.global) {
        let match = Array.from(wild_args.join('/').matchAll(param.regex))

        if (!match.length) {
          return null
        }

        args[param.name] = match
      }
      else {
        args[param!.name] = wild_args as string[]
      }

      k += wild_args.length - 1

      param = param_defs[++pk]
    }

    // leftover optional params
    while (param) {
      if (param.wild) {
        args[param.name] = null
      }
      else {
        args[param.name] = null
      }

      param = param_defs[++pk]
    }

    return args
  }

  return { weight, param_defs, match }
}
