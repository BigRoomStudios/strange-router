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

        return r.path.split((baseRoute.path + '/').replace(/\/+/, '/')).length > 1;
    });

    clone.childRoutes = clone.childRoutes.map(internals.getChildRoutesForBase.bind(null, clone.childRoutes));

    return clone;
};

internals.buildRoutesFromAbsolutePaths = (absolutizedRoutes) => {

    // First look for a route that has root = true
    let root = absolutizedRoutes.find((r) => r.root);

    // Next try, grab the first instance that matches the base ''
    // NOTE the remaining slash routes `/` will be used for catchalls like 404's
    if (!root) {
        root = absolutizedRoutes.find((r) => r.path.length === 1 && r.path === '/');
    }

    const rootChildren = absolutizedRoutes.filter((r) => r.path !== '/');

    root.childRoutes = rootChildren;

    const structuredRoot = internals.getChildRoutesForBase(rootChildren, root);

    // Remove siblings that are also children

    const dedupeChildRoutes = (arr) => {

        return arr.filter((item) => {

            return item.childRoutes.length !== 0;
        })
        .map((itm) => {

            itm.childRoutes = dedupeChildRoutes(itm.childRoutes)
            return itm;
        });
    };

    console.log('structuredRoot', structuredRoot);
    console.log('dedupe(structuredRoot.childRoutes)', dedupeChildRoutes(structuredRoot.childRoutes));
};

internals.renderRoute = (pathPrefix, route) => {

    // Remove any double slashes and we should be good!
    const path = `/${pathPrefix}/${route.path}`.replace(/\/+/g, '/');

    const boundPathPrefixRenderFunc = internals.renderRoute.bind(null, path);

    if (!route.component) {
        // Fail with a useful error msg & info to help debugging
        console.log(route);
        throw new Error(`^^^^Component is falsy for route ${path} logged above^^^^`);
    }

    return (
        <Route
            exact={route.exact}
            key={path}
            path={path}
            strict={route.strict}
            render={(props) => {

                return (
                    <internals.routeComponentLifecycleWrapper {...props} route={route}>
                        <route.component {...props} route={route}>
                            {
                                route.childRoutes &&
                                route.childRoutes.length &&
                                <Switch>
                                    {route.childRoutes.map(boundPathPrefixRenderFunc)}
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

    const boundRenderFunc = internals.renderRoute.bind(null, '/');

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
