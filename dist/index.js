'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

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

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _class, _temp;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var React = require('react');
var T = require('prop-types');

var _require = require('react-router-dom/Switch'),
    Switch = _require.default;

var _require2 = require('react-router-dom/Route'),
    Route = _require2.default;

var internals = {};

exports.buildRoutes = function (routes) {
    return internals.renderRoutes(routes);
};

internals.renderRoutes = function (routes) {

    var absolutizedRoutes = routes.map(internals.rAbsolutizePath.bind(null, '/'));
    var flattenedRoutes = internals.rFlattenArray(absolutizedRoutes.map(internals.rFlattenChildRoutes)).filter(function (rt) {
        return typeof rt.component !== 'undefined';
    }); // Remove structural routes that don't have components

    var rebuiltRoutes = internals.buildRoutesFromAbsolutePaths(flattenedRoutes);
    var slashRoutes = flattenedRoutes.filter(function (r) {
        return r.path === '/';
    });

    return React.createElement(
        Switch,
        null,
        slashRoutes.sort(internals.sortRoutes('/')).map(internals.rRenderRoute),
        rebuiltRoutes.sort(internals.sortRoutes('/')).map(internals.rRenderRoute)
    );
};

// This method assumes every route has an absolute path
internals.rRenderRoute = function (route) {

    if (!route.component) {
        throw new Error('Component is falsy for route "' + route.path + '"');
    }

    return React.createElement(Route, {
        exact: route.exact,
        key: route.path,
        path: route.path,
        strict: route.strict,
        render: function render(props) {

            return React.createElement(
                internals.routeComponentLifecycleWrapper,
                (0, _extends3.default)({}, props, { route: route }),
                React.createElement(
                    route.component,
                    (0, _extends3.default)({}, props, { route: route }),
                    route.childRoutes && route.childRoutes.length !== 0 && React.createElement(
                        Switch,
                        null,
                        route.childRoutes.map(internals.rRenderRoute)
                    )
                )
            );
        }
    });
};

internals.routeComponentLifecycleWrapper = (_temp = _class = function (_React$PureComponent) {
    (0, _inherits3.default)(RouteComponentLifecycleWrapper, _React$PureComponent);

    function RouteComponentLifecycleWrapper(props) {
        (0, _classCallCheck3.default)(this, RouteComponentLifecycleWrapper);

        var _this = (0, _possibleConstructorReturn3.default)(this, (RouteComponentLifecycleWrapper.__proto__ || (0, _getPrototypeOf2.default)(RouteComponentLifecycleWrapper)).call(this));

        var route = props.route,
            match = props.match,
            location = props.location,
            history = props.history;


        if (typeof route.componentDidCatch === 'function') {
            _this.componentDidCatch = function (err, info) {

                route.componentDidCatch(err, info, route, match, location, history);
            };
        }
        return _this;
    }

    (0, _createClass3.default)(RouteComponentLifecycleWrapper, [{
        key: 'componentWillMount',
        value: function componentWillMount() {
            var _props = this.props,
                route = _props.route,
                match = _props.match,
                location = _props.location,
                history = _props.history;


            if (typeof route.onWillMount === 'function') {
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


            if (typeof route.onDidMount === 'function') {
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


            if (typeof route.onWillUnmount === 'function') {
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

internals.rAbsolutizePath = function (pathPrefix, route) {

    // Remove any double slashes and we should be good!
    var path = (pathPrefix + '/' + route.path).replace(/\/+/g, '/');

    var clone = (0, _assign2.default)({}, route);

    if (route.path) {
        clone.path = path;
    }

    var boundAbsolutizePathFunc = internals.rAbsolutizePath.bind(null, path);

    if (clone.childRoutes) {
        clone.childRoutes = clone.childRoutes.map(boundAbsolutizePathFunc);
    }

    return clone;
};

internals.buildRoutesFromAbsolutePaths = function (absolutizedRoutes) {

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

    var rootChildren = absolutizedRoutes.filter(function (r) {
        return r.path !== '/';
    });
    rootRoute.childRoutes = rootChildren;

    var structuredRoot = internals.rGetChildRoutesForBase(rootChildren, rootRoute);

    return internals.rDedupeChildRoutes(structuredRoot.childRoutes);
};

internals.rGetChildRoutesForBase = function (usingRoutes, baseRoute) {

    var routesClone = usingRoutes.slice();
    var clone = (0, _assign2.default)({}, baseRoute);

    clone.childRoutes = usingRoutes.filter(function (r) {
        return r.path && r.path.split((baseRoute.path + '/').replace(/\/+/, '/')).length > 1;
    });

    clone.childRoutes = clone.childRoutes.map(internals.rGetChildRoutesForBase.bind(null, usingRoutes)).sort(internals.sortRoutes(baseRoute.path));

    return clone;
};

internals.rFlattenChildRoutes = function (route) {

    // Clone because we're building an army &&
    // Transform to an array so we can play
    var clone = [].concat((0, _assign2.default)({}, route));

    var parentRoute = clone[0];

    if (parentRoute.childRoutes) {

        var childRoutes = [].concat(parentRoute.childRoutes).slice();
        delete parentRoute.childRoutes;

        return clone.concat(childRoutes.map(internals.rFlattenChildRoutes));
    }

    return clone;
};

internals.rFlattenArray = function (arr) {

    var flat = [];

    arr.forEach(function (arrItem) {

        if (Array.isArray(arrItem)) {

            flat = flat.concat([].concat((0, _toConsumableArray3.default)(internals.rFlattenArray(arrItem))));
        } else {
            flat.push(arrItem);
        }
    });

    return flat;
};

internals.rDedupeChildRoutes = function (routes) {

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
            r.childRoutes = internals.rDedupeChildRoutes(r.childRoutes);
        }

        return r;
    });
};

internals.sortRoutes = function (basePath) {

    return function (a, b) {

        var pathAMinusBase = void 0;
        var pathBMinusBase = void 0;

        if (basePath === '/') {
            pathAMinusBase = a.path;
            pathBMinusBase = b.path;
        } else {
            pathAMinusBase = a.path.split(basePath)[1];
            pathBMinusBase = b.path.split(basePath)[1];
        }

        var pathASplitSlash = pathAMinusBase.split('/').filter(function (pathPiece) {
            return pathPiece !== '';
        });
        var pathBSplitSlash = pathBMinusBase.split('/').filter(function (pathPiece) {
            return pathPiece !== '';
        });

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