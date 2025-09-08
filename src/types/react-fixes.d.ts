// @ts-nocheck
// React type fixes
declare module 'react' {
  interface HTMLAttributes<T> {
    [key: string]: any;
  }
  
  interface ComponentProps<T> {
    [key: string]: any;
  }
  
  type ReactNode = any;
  type ComponentType<P = {}> = any;
  type JSXElementConstructor<P> = any;
  type ReactElement<P = any, T = any> = any;
  type ReactChild = any;
  type ReactFragment = any;
  type ReactPortal = any;
  type ReactText = any;
  type VoidFunctionComponent<P = {}> = any;
  type FC<P = {}> = any;
  type FunctionComponent<P = {}> = any;
  type Component<P = {}, S = {}> = any;
  type PureComponent<P = {}, S = {}> = any;
  type ComponentClass<P = {}, S = any> = any;
  type StatelessComponent<P = {}> = any;
  type SFC<P = {}> = any;
  type ForwardRefExoticComponent<P> = any;
  type RefAttributes<T> = any;
  type Ref<T> = any;
  type LegacyRef<T> = any;
  type MutableRefObject<T> = any;
  type RefObject<T> = any;
  type ForwardedRef<T> = any;
}

export {};