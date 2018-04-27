const React = require('react');
const T = require('prop-types');

const { default: Switch } = require('react-router-dom/Switch');
const { default: Route } = require('react-router-dom/Route');

const internals = {};

exports.buildRoutes = (routes) => internals.renderRoutes(routes);

internals.renderRoutes = (routes) => {

    const rootSlashRoutes = [];
    const rest = [];

    // At the moment, root slash route components will be ignored.
    routes.forEach((r) => r.path === '/' ? rootSlashRoutes.push(r) : rest.push(r));

    // Here we're replacing root slash routes with their children because if there is a slash
    // route at the config root, any catchalls at the bottom of the root config cannot be matched
    // because the root slash route will steal the render. You won't be able to get to
    // a catchall route at the end if this is left in the root config.
    const rootSlashChildren = rootSlashRoutes.map((r) =>  r.childRoutes ? r.childRoutes : [])
        .reduce((collector, r) => collector.concat(r), []);

    const toRender = rest.concat(rootSlashChildren);

    return (
        <Switch>
            {toRender.sort(internals.sortRoutes).map(internals.rRenderRoute('/'))}
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
                                        {route.childRoutes.sort(internals.sortRoutes).map(internals.rRenderRoute(updatedPath))}
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

internals.sortRoutes = (a, b) => {

    // Sort routes by greater specificity (more slashes) on top, less specific on bottom
    // Also, param routes go on the bottom, they will prevent everything below them from matching

    const aPath = (`/${a.path}`).replace(/\/+/g, '/');
    const bPath = (`/${b.path}`).replace(/\/+/g, '/');

    const pathASplitSlash = aPath.split('/').filter((pathPiece) => pathPiece !== '');
    const pathBSplitSlash = bPath.split('/').filter((pathPiece) => pathPiece !== '');

    if (pathASplitSlash.length > pathBSplitSlash.length) {
        return -1;
    }

    if (pathASplitSlash.length < pathBSplitSlash.length) {
        return 1;
    }

    if (pathASplitSlash[0].startsWith(':')) {
        return 1;
    }

    if (pathBSplitSlash[0].startsWith(':')) {
        return -1;
    }

    return 0;
};
