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

internals.getRoutesWithParams = (routes) => {

    let routesWithParams = [];
    let routesWithoutParams = [];

    routes.forEach((childRoute) => {

        // Params are denoted by `:`
        if (childRoute.path && childRoute.path.includes(':')) {
            routesWithParams.push(childRoute);
        }
        else {
            routesWithoutParams.push(childRoute);
        }
    });

    return { routesWithParams, routesWithoutParams };
};

internals.absolutizePath = (pathPrefix, route) => {

    // Remove any double slashes and we should be good!
    const path = `${pathPrefix}/${route.path}`.replace(/\/+/g, '/');

    const clone = Object.assign({}, route);

    clone.path = path;

    const boundAbsolutizePathFunc = internals.absolutizePath.bind(null, path);

    if (clone.childRoutes) {
        clone.childRoutes = clone.childRoutes.map(boundAbsolutizePathFunc);
    }

    return clone;
};

internals.buildRoutesFromAbsolutePaths = () => {

    // Build backwards, and split by slashes
};

internals.reformatRoutes = (routes) => {

    // For react-router v4, routes with params (:myId for example)
    // will only match if they are siblings to their parent routes.

    // The parent routes will also need to be set to exact: true
    // in order for these to match

    // This may have something to do with the `Switch` component
    // or just how the v4 router is setup, I'm unsure at the moment

    if (route.childRoutes) {

        const { routesWithParams, routesWithoutParams } = internals.getRoutesWithParams(route.childRoutes);

        console.log('routesWithParams, routesWithoutParams', routesWithParams, routesWithoutParams);

        // route.childRoutes.forEach((childRoute) => {
        //
        //     // Params are denoted by `:`
        //     if (childRoute.path && childRoute.path.includes(':')) {
        //         childrenWithParams.push(childRoute);
        //     }
        //     else {
        //         finalChildRoutes.push(childRoute);
        //     }
        // });
        //
        // if (parentRoute) {
        //     parentRoute.addedRoutes = childrenWithParams;
        // }
    }
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

            const childRoutes = [].concat(parentRoute.childRoutes);
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



    // const rebuiltRoutes = internals.buildRoutesFromAbsolutePaths(flattenedRoutes);



    // console.log(internals.absolutizePath('/', routes[0]));

    // const boundReformatFunc = internals.reformatRoutes.bind(null, null);
    // console.log(routes.map(boundReformatFunc));

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
