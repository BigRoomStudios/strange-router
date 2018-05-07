const React = require('react');
const T = require('prop-types');

const { default: Switch } = require('react-router-dom/Switch');
const { default: Route } = require('react-router-dom/Route');

const internals = {};

exports.buildRoutes = (routes) => internals.renderRoutes(routes);

internals.renderRoutes = (routes) => {

    // Here we're replacing root slash routes (root config route with { ...path: '/' })
    // with their children because otherwise they will match before anything else

    // These routes will be keyed by their indices
    const rootSlashRoutes = {};

    routes.forEach((r, i) => {

        if (r.path === '/') {
            rootSlashRoutes[String(i)] = r;
        }
    });

    const toRender = [...routes];

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

        const updatedPath = String(`${basePath}/${route.path}`).replace(/\/+/g, '/'); // Remove duplicate slashes
        const RouteComponent = route.component || 'div';

        return (
            <Route
                exact={route.exact}
                key={route.path}
                path={updatedPath}
                strict={route.strict}
                render={(props) => {

                    return (
                        <internals.routeComponentLifecycleWrapper {...props} route={route}>
                            <RouteComponent {...props} route={route}>
                                {
                                    route.childRoutes &&
                                    route.childRoutes.length !== 0 &&
                                    <Switch>
                                        {route.childRoutes.map(internals.rRenderRoute(updatedPath))}
                                    </Switch>
                                }
                            </RouteComponent>
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
}
