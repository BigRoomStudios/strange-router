const React = require('react');
const T = require('prop-types');

const { default: MatchPath } = require('react-router-dom/matchPath');
const { default: Router } = require('react-router-dom/Router');
const { default: Switch } = require('react-router-dom/Switch');
const { default: Route } = require('react-router-dom/Route');

const internals = {};

exports.Router = class StrangeRouter extends React.PureComponent {

    static propTypes = {
        history: T.object,
        routes: T.array.isRequired
    }

    render() {

        const { history, routes } = this.props;

        return (
            <Router
                history={history}>
                {internals.renderRoutes(routes)}
            </Router>
        );
    }
};

internals.routeComponentWrapper = class RouteWrapper extends React.PureComponent {

    static propTypes = {
        match: T.object,
        location: T.object,
        history: T.object,
        route: T.object
    }

    componentWillMount() {

        const { route, match, location, history } = this.props;

        if (route.onWillMount) {
            route.onWillMount(route, match, location, history);
        }
    }

    componentDidMount() {

        const { route, match, location, history } = this.props;

        if (route.onDidMount) {
            route.onDidMount(route, match, location, history);
        }
    }

    componentWillUnmount() {

        const { route, match, location, history } = this.props;

        if (route.onWillUnmount) {
            route.onWillUnmount(route, match, location, history);
        }
    }

    render() {

        return this.props.children;
    }
}

internals.renderRoutes = (routes) => {

    const renderRouteRecursive = (pathPrefix, route) => {

        // These relative paths seem to require a slash in front

        // Remove any double slashes and we should be good!
        const path = `${pathPrefix}/${route.path}`.replace(/\/+/g, '/');

        console.log('pathPrefix', pathPrefix);
        console.log('path', path);

        let isLeafRoute = true;

        if (!route.childRoutes) {
            isLeafRoute = true;
        }

        const boundRenderFunc = renderRouteRecursive.bind(null, path);

        return (
            <Route
                exact={route.exact}
                key={path}
                path={path}
                strict={route.strict}
                render={(props) => (

                    <internals.routeComponentWrapper {...props} route={route}>
                        <route.component {...props} route={route}>
                            {
                                route.childRoutes &&
                                route.childRoutes.length &&
                                <Switch>
                                    {route.childRoutes.map(boundRenderFunc)}
                                </Switch>
                            }
                        </route.component>
                    </internals.routeComponentWrapper>
                )}
            />
        );
    };

    const boundRenderFunc = renderRouteRecursive.bind(null, '/');

    return (
        <Switch>
            {routes.map(boundRenderFunc)}
        </Switch>
    );
};


// This is useful for server-side rendering

const { computeMatch } = Router.prototype;

exports.matchRoutes = (routes, pathname, branch = []) => {

    routes.some((route) => {

        const match = route.path
        ? MatchPath(pathname, route)
        : branch.length
        ? branch[branch.length - 1].match // use parent match
        : computeMatch(pathname); // use default "root" match

        if (match) {
            branch.push({ route, match });

            if (route.childRoutes) {
                exports.matchRoutes(route.childRoutes, pathname, branch);
            }
        }

        return match;
    });

    return branch;
};
