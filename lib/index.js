const React = require('react');
const T = require('prop-types');

const { default: Switch } = require('react-router-dom/Switch');
const { default: Route } = require('react-router-dom/Route');

const internals = {};

exports.buildRoutes = (routes) => internals.renderRoutes(routes);

internals.renderRoutes = (routes) => {

    // Here we're replacing root slash routes (root config route with { ...path: '/' })
    // with their children if available because at root level a slash route is the same
    // as a param route ({ ...path: ':myParam' })

    const rootSlashRoutes = {};

    routes.forEach((r, i) => {

        if (r.path === '/') {
            rootSlashRoutes[String(i)] = r; // These routes will be keyed by their indices
        }
    });

    const toRender = [...routes];

    // Replace slash routes with their children at their indices
    for (let i = routes.length; i > 1; --i) {

        const route = rootSlashRoutes[i];
        if (route && route.childRoutes) {
            toRender.splice(i, 1, ...route.childRoutes);
        }
    }

    return (
        <Switch>
            {toRender.map(internals.rRenderRoute('/'))}
        </Switch>
    );
};

internals.rRenderRoute = (basePath) => {

    return (route) => {

        const normalizedPath = internals.concatPaths(basePath, route.path);
        const RouteComponent = route.component;

        return (
            <Route
                exact={route.exact}
                key={route.path}
                path={normalizedPath}
                strict={route.strict}
                render={(props) => {

                    const childSwitcher = route.childRoutes ? <Switch>{route.childRoutes.map(internals.rRenderRoute(normalizedPath))}</Switch> : null;

                    return (
                        <internals.routeComponentLifecycleWrapper {...props} route={route}>
                            {RouteComponent
                                ? <RouteComponent {...props} route={route}>{childSwitcher}</RouteComponent>
                                : childSwitcher
                            }
                        </internals.routeComponentLifecycleWrapper>
                    );
                }}
            />
        );
    };
};

internals.routeComponentLifecycleWrapper = class RouteComponentLifecycleWrapper extends React.PureComponent {

    static propTypes = {
        match: T.object,
        location: T.object,
        history: T.object,
        route: T.object
    }

    constructor(props) {

        super();

        const { route, match, location, history } = props;

        if (typeof route.componentDidCatch === 'function') {
            this.componentDidCatch = (err, info) => {

                route.componentDidCatch(err, info, route, match, location, history);
            }
        }
    }

    componentWillMount() {

        const { route, match, location, history } = this.props;

        if (typeof route.onWillMount === 'function') {
            route.onWillMount(route, match, location, history);
        }
    }

    componentDidMount() {

        const { route, match, location, history } = this.props;

        if (typeof route.onDidMount === 'function') {
            route.onDidMount(route, match, location, history);
        }
    }

    componentWillUnmount() {

        const { route, match, location, history } = this.props;

        if (typeof route.onWillUnmount === 'function') {
            route.onWillUnmount(route, match, location, history);
        }
    }

    render() {

        return this.props.children;
    }
};

internals.concatPaths = (base, path) => {

    base = base.endsWith('/') ? base.slice(0, -1) : base; // /my-path/ -> /my-path
    path = path.startsWith('/') ? path.slice(1) : path;   // /my-path -> my-path

    return `${base}/${path}`;
};
