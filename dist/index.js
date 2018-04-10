'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _class, _temp;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var React = require('react');
var T = require('prop-types');

var _require = require('react-router-dom/matchPath'),
    MatchPath = _require.default;

var _require2 = require('react-router-redux'),
    ConnectedRouter = _require2.ConnectedRouter;

var _require3 = require('react-router-dom/Switch'),
    Switch = _require3.default;

var _require4 = require('react-router-dom/Route'),
    Route = _require4.default;

var internals = {};

exports.buildRoutes = function (routes) {
    return internals.renderRoutes(routes);
};

internals.routeComponentLifecycleWrapper = (_temp = _class = function (_React$PureComponent) {
    (0, _inherits3.default)(RouteComponentLifecycleWrapper, _React$PureComponent);

    function RouteComponentLifecycleWrapper() {
        (0, _classCallCheck3.default)(this, RouteComponentLifecycleWrapper);
        return (0, _possibleConstructorReturn3.default)(this, (RouteComponentLifecycleWrapper.__proto__ || (0, _getPrototypeOf2.default)(RouteComponentLifecycleWrapper)).apply(this, arguments));
    }

    (0, _createClass3.default)(RouteComponentLifecycleWrapper, [{
        key: 'componentWillMount',
        value: function componentWillMount() {
            var _props = this.props,
                route = _props.route,
                match = _props.match,
                location = _props.location,
                history = _props.history;


            if (route.onWillMount) {
                route.onWillMount(route, match, location, history);
            }
        }
    }, {
        key: 'componentDidMount',
        value: function componentDidMount() {
            var _props2 = this.props,
                route = _props2.route,
                match = _props2.match,
                location = _props2.location,
                history = _props2.history;


            if (route.onDidMount) {
                route.onDidMount(route, match, location, history);
            }
        }
    }, {
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
            var _props3 = this.props,
                route = _props3.route,
                match = _props3.match,
                location = _props3.location,
                history = _props3.history;


            if (route.onWillUnmount) {
                route.onWillUnmount(route, match, location, history);
            }
        }
    }, {
        key: 'render',
        value: function render() {

            return this.props.children;
        }
    }]);
    return RouteComponentLifecycleWrapper;
}(React.PureComponent), _class.propTypes = {
    match: T.object,
    location: T.object,
    history: T.object,
    route: T.object
}, _temp);

internals.absolutizePath = function (pathPrefix, route) {

    // Remove any double slashes and we should be good!
    var path = (pathPrefix + '/' + route.path).replace(/\/+/g, '/');

    var clone = (0, _assign2.default)({}, route);

    if (route.path) {
        clone.path = path;
    }

    var boundAbsolutizePathFunc = internals.absolutizePath.bind(null, path);

    if (clone.childRoutes) {
        clone.childRoutes = clone.childRoutes.map(boundAbsolutizePathFunc);
    }

    return clone;
};

internals.getChildRoutesForBase = function (forcedSiblingRoutes, usingRoutes, baseRoute) {

    var routesClone = usingRoutes.slice();
    var clone = (0, _assign2.default)({}, baseRoute);

    clone.childRoutes = usingRoutes.filter(function (r) {

        return r.path && r.path.split((baseRoute.path + '/').replace(/\/+/, '/').replace(/\\+/, '\\')).length > 1;
    });

    var extraSiblings = [];
    clone.childRoutes.forEach(function (rt) {

        if (rt.siblings) {
            rt.siblings.forEach(function (sibId) {

                var sibling = internals.getRouteById(forcedSiblingRoutes, sibId);
                if (!sibling) {
                    throw new Error('Something went wrong');
                };
                extraSiblings.push(sibling);

                var moreSiblings = sibling.siblings;
                if (moreSiblings) {
                    moreSiblings.forEach(function (sId) {

                        var sibling = internals.getRouteById(forcedSiblingRoutes, sId);
                        if (!sibling) {
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

internals.buildRoutesFromAbsolutePaths = function (absolutizedRoutes, regularRoutes, forcedSiblingRoutes) {

    // First look for a route that has root === true
    var rootRoute = absolutizedRoutes.find(function (r) {
        return r.root;
    });

    // Next try, grab the first instance that matches the base ''
    // NOTE the remaining slash routes `/` will be used for catchalls like 404's

    // Grab the first slash route if there isn't a root: true route
    if (!rootRoute) {
        rootRoute = absolutizedRoutes.find(function (r) {
            return r.path === '/';
        });
    }

    var rootChildren = regularRoutes.filter(function (r) {
        return r.path !== '/';
    });
    rootRoute.childRoutes = rootChildren;

    var structuredRoot = internals.getChildRoutesForBase(forcedSiblingRoutes, rootChildren, rootRoute);

    // Remove siblings that are also childRoutes the next level down
    // This is a fix for an artifact of only setting child routes based on absolute path
    var dedupeChildRoutes = function dedupeChildRoutes(routes) {

        var allChildRoutes = routes.reduce(function (collector, r) {

            if (!r.childRoutes) {
                return collector;
            }

            collector = collector.concat(r.childRoutes);
            return collector;
        }, []);

        return routes.filter(function (r) {

            return !allChildRoutes.find(function (cr) {

                return cr.path === r.path;
            });
        }).map(function (r) {

            if (r.childRoutes) {
                r.childRoutes = dedupeChildRoutes(r.childRoutes);
            }

            return r;
        });
    };

    return dedupeChildRoutes(structuredRoot.childRoutes);
};

// This method assumes every route has an absolute path
internals.renderRoute = function (route) {

    if (!route.component) {
        // Fail with a useful error msg & info to help debugging
        console.log(route);
        throw new Error('^^^^Component is falsy for route ' + route.path + ' logged above^^^^');
    }

    return React.createElement(Route, {
        exact: route.exact,
        key: route.path,
        path: route.path,
        strict: route.strict,
        render: function render(props) {

            console.log('props.match', props.match);
            console.log('route.childRoutes', route.childRoutes);

            var matching = (route.childRoutes || []).find(function (rt) {
                return rt.path === props.match.url;
            });
            console.log('matching', matching);

            return React.createElement(
                internals.routeComponentLifecycleWrapper,
                (0, _extends3.default)({}, props, { route: route }),
                React.createElement(
                    route.component,
                    (0, _extends3.default)({}, props, { route: route }),
                    route.childRoutes && route.childRoutes.length !== 0 && React.createElement(
                        Switch,
                        null,
                        route.childRoutes.map(internals.renderRoute)
                    )
                )
            );
        }
    });
};

internals.getRouteById = function (routes, id) {
    return routes.find(function (rt) {
        return rt._id === id;
    });
};

internals.renderRoutes = function (routes) {

    var absolutizedRoutes = routes.map(internals.absolutizePath.bind(null, '/'));

    var flattenChildRoutes = function flattenChildRoutes(route) {

        // Clone because we're building an army &&
        // Transform to an array so we can play
        var clone = [].concat((0, _assign2.default)({}, route));

        var parentRoute = clone[0];

        if (parentRoute.childRoutes) {

            var childRoutes = [].concat(parentRoute.childRoutes).slice();
            delete parentRoute.childRoutes;

            return clone.concat(childRoutes.map(flattenChildRoutes));
        }

        return clone;
    };

    var flattenedChildRoutes = absolutizedRoutes.map(flattenChildRoutes);

    var flattenArray = function flattenArray(arr) {

        var flat = [];

        arr.forEach(function (arrItem) {

            if (Array.isArray(arrItem)) {

                flat = flat.concat([].concat((0, _toConsumableArray3.default)(flattenArray(arrItem))));
            } else {
                flat.push(arrItem);
            }
        });

        return flat;
    };

    var flattenedRoutes = flattenArray(flattenedChildRoutes).map(function (rt, i) {

        // Give them all ids for later reference
        rt._id = i;
        return rt;
    });

    console.log('flattenedRoutes', flattenedRoutes);

    var matchingPath = function matchingPath(str) {
        return flattenedRoutes.find(function (rt) {
            return rt.path === str;
        });
    };

    // Because of how react-router v4's Switch works, we need to shift up
    // any routes that
    // 1) share a path with another route's full path AND
    // 2) have a param, denoted by `:`
    // We'll call them 'forced siblings'

    // Lets grab some forced sibling info

    var regularRoutes = [];
    var forcedSiblingRoutes = [];

    flattenedRoutes.forEach(function (rt) {

        if (rt.path.includes(':')) {
            var splitByColon = rt.path.split(':');
            splitByColon.pop();
            var pathBeforeParam = splitByColon.join(':');
            // pop off the trailing slash
            pathBeforeParam = pathBeforeParam.substring(0, pathBeforeParam.length - 1);
            var matching = matchingPath(pathBeforeParam);
            if (matching) {
                matching.siblings = matching.siblings || [];
                matching.siblings.push(rt._id);
                forcedSiblingRoutes.push(rt);
            } else {
                regularRoutes.push(rt);
            }
        } else {
            regularRoutes.push(rt);
        }
    });

    console.log('regularRoutes', regularRoutes);
    console.log('forcedSiblingRoutes', forcedSiblingRoutes);

    var rebuiltRoutes = internals.buildRoutesFromAbsolutePaths(flattenedRoutes, regularRoutes, forcedSiblingRoutes);

    console.log('rebuiltRoutes', rebuiltRoutes);

    var slashRoutes = flattenedRoutes.filter(function (r) {

        return r.path === '/';
    }).map(internals.renderRoute);

    return React.createElement(
        Switch,
        null,
        slashRoutes,
        rebuiltRoutes.map(internals.renderRoute)
    );
};

// This is useful for server-side rendering

var computeMatch = ConnectedRouter.prototype.computeMatch;


exports.matchRoutes = function (routes, pathname) {
    var branch = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];


    routes.some(function (route) {

        var match = route.path ? MatchPath(pathname, route) : branch.length ? branch[branch.length - 1].match // use parent match
        : computeMatch(pathname); // use default "root" match

        if (match) {
            branch.push({ route: route, match: match });

            if (route.childRoutes) {
                exports.matchRoutes(route.childRoutes, pathname, branch);
            }
        }

        return match;
    });

    return branch;
};