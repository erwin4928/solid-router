import { Accessor } from 'solid-js';
import { Component } from 'solid-js';
import { JSX } from 'solid-js';
import { ParentComponent } from 'solid-js';

declare type Intent = 'internal' | 'popstate' | 'navigate';

declare interface NavigateOptions {
    state?: unknown;
    replace?: boolean;
    search_params?: Params;
}

declare type Params = Record<string, string | string[]>;

export declare let Route: Component<RouteProps>;

declare type RouteProps = {
    path?: string;
    children?: JSX.Element;
    component?: Component<any>;
};

export declare let Router: ParentComponent;

export declare let use_depth: () => Accessor<number>;

export declare let use_hash: () => [Accessor<string>, (hash: string) => void];

export declare let use_intent: () => Accessor<Intent>;

export declare let use_is_routing: () => Accessor<boolean>;

export declare let use_navigate: () => {
    (url: string, options?: NavigateOptions): void;
    (delta: number): void;
};

export declare let use_outlet: () => Accessor<() => JSX>;

export declare let use_params: <P extends Params = Params>() => [P, (params: Partial<P>) => void];

export declare let use_pathname: () => [Accessor<string>, (pathname: string) => void];

export declare let use_referrer: () => Accessor<string | undefined>;

export declare let use_search: () => [Accessor<string>, (search: string) => void];

export declare let use_search_params: <P extends Params = Params>() => [P, (params: Partial<P>) => void];

export declare let use_state: <S = unknown>() => [Accessor<S>, (value: unknown) => void];

export { }


declare module 'solid-js' {
    namespace JSX {
        interface AnchorHTMLAttributes<T> {
            state?: string;
            replace?: boolean;
        }
    }
}
