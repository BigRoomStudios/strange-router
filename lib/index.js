const React = require('react');
const T = require('prop-types');

const { default: MatchPath } = require('react-router-dom/matchPath');
const { default: Switch } = require('react-router-dom/Switch');
const { default: Route } = require('react-router-dom/Route');

const internals = {};

exports.buildRoutes = (routes) => internals.renderRoutes(routes);

internals.renderRoutes = (routes) => {

    const absolutizedRoutes = routes.map(internals.absolutizePath.bind(null, '/'));
    const flattenedRoutes = internals.flattenArray(absolutizedRoutes.map(internals.flattenChildRoutes))
        .filter((rt) => typeof rt.component !== 'undefined'); // Remove structural routes that don't have components

    const rebuiltRoutes = internals.buildRoutesFromAbsolutePaths(flattenedRoutes);
    const slashRoutes = flattenedRoutes.filter((r) => r.path === '/');

    return (
        <Switch>
            {slashRoutes.sort(internals.sortRoutes('/')).map(internals.renderRoute)}
            {rebuiltRoutes.sort(internals.sortRoutes('/')).map(internals.renderRoute)}
        </Switch>
    );
};

// This method assumes every route has an absolute path
internals.renderRoute = (route) => {

    if (!route.component) {
        // Fail with a useful error msg & info to help debugging
        throw new Error(`Component is falsy for route "${route.path}"`);
    }

    return (
        <Route
            exact={route.exact}
            key={route.path}
            path={route.path}
            strict={route.strict}
            render={(props) => {

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

internals.buildRoutesFromAbsolutePaths = (absolutizedRoutes) => {

    // First look for a route that has root === true
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

    return internals.dedupeChildRoutes(structuredRoot.childRoutes);
};

internals.getChildRoutesForBase = (usingRoutes, baseRoute) => {

    const routesClone = usingRoutes.slice();
    const clone = Object.assign({}, baseRoute);

    clone.childRoutes = usingRoutes.filter((r) => r.path && r.path.split((baseRoute.path + '/').replace(/\/+/, '/')).length > 1);

    clone.childRoutes = clone.childRoutes.map(internals.getChildRoutesForBase.bind(null, usingRoutes))
        .sort(internals.sortRoutes(baseRoute.path));

    return clone;
};

internals.flattenChildRoutes = (route) => {

    // Clone because we're building an army &&
    // Transform to an array so we can play
    let clone = [].concat(Object.assign({}, route));

    const parentRoute = clone[0];

    if (parentRoute.childRoutes) {

        const childRoutes = [].concat(parentRoute.childRoutes).slice();
        delete parentRoute.childRoutes;

        return clone.concat(childRoutes.map(internals.flattenChildRoutes));
    }

    return clone;
};

internals.flattenArray = (arr) => {

    let flat = [];

    arr.forEach((arrItem) => {

        if (Array.isArray(arrItem)) {

            flat = flat.concat([...internals.flattenArray(arrItem)]);
        }
        else {
            flat.push(arrItem);
        }
    });

    return flat;
};

internals.dedupeChildRoutes = (routes) => {

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
            r.childRoutes = internals.dedupeChildRoutes(r.childRoutes);
        }

        return r;
    });
};

internals.sortRoutes = (basePath) => {

    return (a, b) => {

        let pathAMinusBase;
        let pathBMinusBase;

        if (basePath === '/') {
            pathAMinusBase = a.path;
            pathBMinusBase = b.path;
        }
        else {
            pathAMinusBase = a.path.split(basePath)[1];
            pathBMinusBase = b.path.split(basePath)[1];
        }

        const pathASplitSlash = pathAMinusBase.split('/').filter((pathPiece) => pathPiece !== '');
        const pathBSplitSlash = pathBMinusBase.split('/').filter((pathPiece) => pathPiece !== '');

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
};
