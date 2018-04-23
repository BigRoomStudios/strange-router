const React = require('react');
const T = require('prop-types');

const { default: MatchPath } = require('react-router-dom/matchPath');
const { default: Switch } = require('react-router-dom/Switch');
const { default: Route } = require('react-router-dom/Route');

const internals = {};

exports.buildRoutes = (routes) => internals.renderRoutes(routes);

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

internals.getChildRoutesForBase = (forcedSiblingRoutes, usingRoutes, baseRoute) => {

    const routesClone = usingRoutes.slice();
    const clone = Object.assign({}, baseRoute);

    clone.childRoutes = usingRoutes.filter((r) => {

        return r.path && r.path.split((baseRoute.path + '/').replace(/\/+/, '/').replace(/\\+/, '\\')).length > 1;
    });

    const extraSiblings = [];
    clone.childRoutes.forEach((rt) => {

        if (rt.siblings) {
            rt.siblings.forEach((sibId) => {

                const sibling = internals.getRouteById(forcedSiblingRoutes, sibId);
                if(!sibling) {
                    throw new Error('Something went wrong');
                };
                extraSiblings.push(sibling);

                const moreSiblings = sibling.siblings;
                if (moreSiblings) {
                    moreSiblings.forEach((sId) => {

                        const sibling = internals.getRouteById(forcedSiblingRoutes, sId);
                        if(!sibling) {
                            throw new Error('Something went wrong');
                        };
                        extraSiblings.push(sibling);
                    });
                }
            });
        }
    });

    clone.childRoutes = clone.childRoutes.concat(extraSiblings);
    clone.childRoutes = clone.childRoutes.map(internals.getChildRoutesForBase.bind(null, forcedSiblingRoutes, usingRoutes));

    return clone;
};

internals.buildRoutesFromAbsolutePaths = (absolutizedRoutes, regularRoutes, forcedSiblingRoutes) => {

    // First look for a route that has root === true
    let rootRoute = absolutizedRoutes.find((r) => r.root);

    // Next try, grab the first instance that matches the base ''
    // NOTE the remaining slash routes `/` will be used for catchalls like 404's

    // Grab the first slash route if there isn't a root: true route
    if (!rootRoute) {
        rootRoute = absolutizedRoutes.find((r) => r.path === '/');
    }

    const rootChildren = regularRoutes.filter((r) => r.path !== '/');
    rootRoute.childRoutes = rootChildren;

    const structuredRoot = internals.getChildRoutesForBase(forcedSiblingRoutes, rootChildren, rootRoute);

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
                console.log('route.childRoutes', route.childRoutes);

                const matching = (route.childRoutes || []).find((rt) => rt.path === props.match.url);
                console.log('matching', matching);

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

internals.getRouteById = (routes, id) => routes.find((rt) => rt._id === id);

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

    const flattenedRoutes = flattenArray(flattenedChildRoutes).map((rt, i) => {

        // Give them all ids for later reference
        rt._id = i;
        return rt;
    });

    console.log('flattenedRoutes', flattenedRoutes);

    const matchingPath = (str) => flattenedRoutes.find((rt) => rt.path === str);

    // Because of how react-router v4's Switch works, we need to shift up
    // any routes that
    // 1) share a path with another route's full path AND
    // 2) have a param, denoted by `:`
    // We'll call them 'forced siblings'

    // Lets grab some forced sibling info

    let regularRoutes = [];
    let forcedSiblingRoutes = [];

    flattenedRoutes.forEach((rt) => {

        if (rt.path.includes(':')) {
            const splitByColon = rt.path.split(':');
            splitByColon.pop();
            let pathBeforeParam = splitByColon.join(':');
            // pop off the trailing slash
            pathBeforeParam = pathBeforeParam.substring(0, pathBeforeParam.length - 1);
            const matching = matchingPath(pathBeforeParam);
            if (matching) {
                // matching.siblings = matching.siblings || [];
                // matching.siblings.push(rt._id);
                forcedSiblingRoutes.push(rt);
            }
            else {
                regularRoutes.push(rt);
            }
        }
        else {
            regularRoutes.push(rt);
        }
    });

    console.log('regularRoutes', regularRoutes);
    console.log('forcedSiblingRoutes', forcedSiblingRoutes);

    const rebuiltRoutes = internals.buildRoutesFromAbsolutePaths(flattenedRoutes, regularRoutes, forcedSiblingRoutes);

    console.log('rebuiltRoutes', rebuiltRoutes);

    const slashRoutes = flattenedRoutes.filter((r) => {

        return r.path === '/';
    })
    .map(internals.renderRoute);

    console.log('slashRoutes', slashRoutes);

    return (
        <Switch>
            {slashRoutes}
            {rebuiltRoutes.map(internals.renderRoute)}
        </Switch>
    );
};

// This is useful for server-side rendering

// const { computeMatch } = ConnectedRouter.prototype;
//
// exports.matchRoutes = (routes, pathname, branch = []) => {
//
//     routes.some((route) => {
//
//         const match = route.path
//         ? MatchPath(pathname, route)
//         : branch.length
//         ? branch[branch.length - 1].match // use parent match
//         : computeMatch(pathname); // use default "root" match
//
//         if (match) {
//             branch.push({ route, match });
//
//             if (route.childRoutes) {
//                 exports.matchRoutes(route.childRoutes, pathname, branch);
//             }
//         }
//
//         return match;
//     });
//
//     return branch;
// };
