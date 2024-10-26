import { Component, JSX, children, mergeProps } from 'solid-js'

export type RouteProps = {
  path?: string
  children?: JSX.Element
  component?: Component<any>
}

export let Route: Component<RouteProps> = (props) => {
  let resolved = children(() => props.children)

  return mergeProps(props, {

    get children() {
      let children = resolved()

      if (children && !Array.isArray(children)) {
        children = [children]
      }

      return children
    },
  }) as unknown as JSX.Element
}
