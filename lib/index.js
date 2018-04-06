const React = require('react');
const T = require('prop-types');

const { default: MatchPath } = require('react-router-dom/matchPath');
const { ConnectedRouter } = require('react-router-redux');
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
            <ConnectedRouter
                history={history}>
                {internals.renderRoutes(routes)}
            </ConnectedRouter>
        );
    }
};

internals.routeComponentLifecycleWrapper = class RouteComponentLifecycleWrapper extends React.PureComponent {

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

internals.absolutizePath = (pathPrefix, route) => {

    // Remove any double slashes and we should be good!
    const path = `${pathPrefix}/${route.path}`.replace(/\/+/g, '/');

    const clone = Object.assign({}, route);

    if (route.path) {
        clone.path = path;
    }

    const boundAbsolutizePathFunc = internals.absolutizePath.bind(null, path);

    if (clone.childRoutes) {
        clone.childRoutes = clone.childRoutes.map(boundAbsolutizePathFunc);
    }

    return clone;
};

internals.getChildRoutesForBase = (usingRoutes, baseRoute) => {

    const routesClone = usingRoutes.slice();
    const clone = Object.assign({}, baseRoute);

    clone.childRoutes = usingRoutes.filter((r) => {

        return r.path && r.path.split((baseRoute.path + '/').replace(/\/+/, '/')).length > 1;
    });

    clone.childRoutes = clone.childRoutes.map(internals.getChildRoutesForBase.bind(null, usingRoutes));

    return clone;
};

internals.buildRoutesFromAbsolutePaths = (absolutizedRoutes) => {

    // First look for a route that has root = true
    let rootRoute = absolutizedRoutes.find((r) => r.root);

    // Next try, grab the first instance that matches the base ''
    // NOTE the remaining slash routes `/` will be used for catchalls like 404's

    // Grab the first slash route if there isn't a root: true route
    if (!rootRoute) {
        rootRoute = absolutizedRoutes.find((r) => r.path === '/');
    }

    const rootChildren = absolutizedRoutes.filter((r) => r.path !== '/');
    rootRoute.childRoutes = rootChildren;

    const structuredRoot = internals.getChildRoutesForBase(rootChildren, rootRoute);

    // Remove siblings that are also childRoutes the next level down
    // This is a fix for an artifact of only setting child routes based on absolute path
    const dedupeChildRoutes = (routes) => {

        const allChildRoutes = routes
            .reduce((collector, r) => {

                if (!r.childRoutes) {
                    return collector;
                }

                collector = collector.concat(r.childRoutes);
                return collector;
            }, []);

        return routes.filter((r) => {

            return !allChildRoutes.find((cr) => {

                return cr.path === r.path;
            })
        })
        .map((r) => {

            if (r.childRoutes) {
                r.childRoutes = dedupeChildRoutes(r.childRoutes);
            }

            return r;
        });
    };

    return dedupeChildRoutes(structuredRoot.childRoutes);
};

// This method assumes every route has an absolute path
internals.renderRoute = (route) => {

    if (!route.component) {
        // Fail with a useful error msg & info to help debugging
        console.log(route);
        throw new Error(`^^^^Component is falsy for route ${route.path} logged above^^^^`);
    }

    return (
        <Route
            exact={route.exact}
            key={route.path}
            path={route.path}
            strict={route.strict}
            render={(props) => {

                console.log('props.match', props.match);

                return (
                    <internals.routeComponentLifecycleWrapper {...props} route={route}>
                        <route.component {...props} route={route}>
                            {
                                route.childRoutes &&
                                route.childRoutes.length !== 0 &&
                                <Switch>
                                    {route.childRoutes.map(internals.renderRoute)}
                                </Switch>
                            }
                        </route.component>
                    </internals.routeComponentLifecycleWrapper>
                );
            }}
        />
    );
};

internals.renderRoutes = (routes) => {

    const absolutizedRoutes = routes.map(internals.absolutizePath.bind(null, '/'));

    const flattenChildRoutes = (route) => {

        // Clone because we're building an army &&
        // Transform to an array so we can play
        let clone = [].concat(Object.assign({}, route));

        const parentRoute = clone[0];

        if (parentRoute.childRoutes) {

            const childRoutes = [].concat(parentRoute.childRoutes).slice();
            delete parentRoute.childRoutes;

            return clone.concat(childRoutes.map(flattenChildRoutes));
        }

        return clone;
    };

    const flattenedChildRoutes = absolutizedRoutes.map(flattenChildRoutes);

    const flattenArray = (arr) => {

        let flat = [];

        arr.forEach((arrItem) => {

            if (Array.isArray(arrItem)) {

                flat = flat.concat([...flattenArray(arrItem)]);
            }
            else {
                flat.push(arrItem);
            }
        });

        return flat;
    };

    const flattenedRoutes = flattenArray(flattenedChildRoutes);
    console.log('flattenedRoutes', flattenedRoutes);

    const rebuiltRoutes = internals.buildRoutesFromAbsolutePaths(flattenedRoutes);
    console.log('rebuiltRoutes', rebuiltRoutes);

    // We want to shift up any routes that have a param, denoted by `:`

    const shiftUpParamRoutes = (routes) => {

        let clone = routes.slice();

        const paramChildRoutes = routes
            .reduce((collector, r) => {

                if (!r.childRoutes) {
                    return collector;
                }

                collector = collector.concat(r.childRoutes);
                return collector;
            }, []);

        // allChildRoutes

        const paramChildren = clone.childRoutes.filter((r) => r.path.indexOf(':') === 0);
    };

    const slashRoutes = flattenedRoutes.filter((r) => {

        return r.path === '/';
    })
    .map(internals.renderRoute);

    return (
        <Switch>
            {slashRoutes}
            {rebuiltRoutes.map(internals.renderRoute)}
        </Switch>
    );
};

// This is useful for server-side rendering

const { computeMatch } = ConnectedRouter.prototype;

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
