# API
## Routes:
`path (required)`
  - Relative path

`component (optional)`
  - Any React component. If this route has childRoutes, this component should render `props.children`
  - Receives props: `{ match, location, history }`

`childRoutes (optional)`
  - Optional
  - Array of routes / redirects

`onWillMount (optional)`
  - Lifecycle hook for `componentWillMount`
  - Receives obj: `{ route, match, location, history }`

`onDidMount (optional)`
  - Lifecycle hook for `componentDidMount`
  - Receives obj: `{ route, match, location, history }`

`onWillUnmount (optional)`
  - Lifecycle hook for `componentWillUnmount`
  - Receives obj: `{ route, match, location, history }`

`componentDidCatch (optional)`
  - Lifecycle hook for `componentDidCatch`
  - Receives obj: `{ err, info, route, match, location, history }`

---

## Redirects:
- Special object that passes props to a [Redirect component](https://reacttraining.com/react-router/web/api/Redirect)

`to (required)`
  - Relative path unless path begins with `/`, then it's absolute

`from (optional)`
  - Relative path

`exact (optional)`
  - Boolean, treat the same as `exact` for route paths

`push (optional)`
  - Boolean, if true will push path instead of replacing

`strict (optional)`
  - Treat the same as `strict` for route paths
