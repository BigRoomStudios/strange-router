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

var _class, _temp, _class2, _temp2;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var React = require('react');
var T = require('prop-types');

var _require = require('react-router-dom/matchPath'),
    MatchPath = _require.default;

var _require2 = require('react-router-dom/Router'),
    Router = _require2.default;

var _require3 = require('react-router-dom/Switch'),
    Switch = _require3.default;

var _require4 = require('react-router-dom/Route'),
    Route = _require4.default;

var internals = {};

exports.Router = (_temp = _class = function (_React$PureComponent) {
    (0, _inherits3.default)(StrangeRouter, _React$PureComponent);

    function StrangeRouter() {
        (0, _classCallCheck3.default)(this, StrangeRouter);
        return (0, _possibleConstructorReturn3.default)(this, (StrangeRouter.__proto__ || (0, _getPrototypeOf2.default)(StrangeRouter)).apply(this, arguments));
    }

    (0, _createClass3.default)(StrangeRouter, [{
        key: 'render',
        value: function render() {
            var _props = this.props,
                history = _props.history,
                routes = _props.routes;


            return React.createElement(
                Router,
                {
                    history: history },
                internals.renderRoutes(routes)
            );
        }
    }]);
    return StrangeRouter;
}(React.PureComponent), _class.propTypes = {
    history: T.object,
    routes: T.array.isRequired
}, _temp);

internals.routeComponentLifecycleWrapper = (_temp2 = _class2 = function (_React$PureComponent2) {
    (0, _inherits3.default)(RouteComponentLifecycleWrapper, _React$PureComponent2);

    function RouteComponentLifecycleWrapper() {
        (0, _classCallCheck3.default)(this, RouteComponentLifecycleWrapper);
        return (0, _possibleConstructorReturn3.default)(this, (RouteComponentLifecycleWrapper.__proto__ || (0, _getPrototypeOf2.default)(RouteComponentLifecycleWrapper)).apply(this, arguments));
    }

    (0, _createClass3.default)(RouteComponentLifecycleWrapper, [{
        key: 'componentWillMount',
        value: function componentWillMount() {
            var _props2 = this.props,
                route = _props2.route,
                match = _props2.match,
                location = _props2.location,
                history = _props2.history;


            if (route.onWillMount) {
                route.onWillMount(route, match, location, history);
            }
        }
    }, {
        key: 'componentDidMount',
        value: function componentDidMount() {
            var _props3 = this.props,
                route = _props3.route,
                match = _props3.match,
                location = _props3.location,
                history = _props3.history;


            if (route.onDidMount) {
                route.onDidMount(route, match, location, history);
            }
        }
    }, {
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
            var _props4 = this.props,
                route = _props4.route,
                match = _props4.match,
                location = _props4.location,
                history = _props4.history;


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
}(React.PureComponent), _class2.propTypes = {
    match: T.object,
    location: T.object,
    history: T.object,
    route: T.object
}, _temp2);

internals.getRoutesWithParams = function (routes) {

    var routesWithParams = [];
    var routesWithoutParams = [];

    routes.forEach(function (childRoute) {

        // Params are denoted by `:`
        if (childRoute.path && childRoute.path.includes(':')) {
            routesWithParams.push(childRoute);
        } else {
            routesWithoutParams.push(childRoute);
        }
    });

    return { routesWithParams: routesWithParams, routesWithoutParams: routesWithoutParams };
};

internals.absolutizePath = function (pathPrefix, route) {

    // Remove any double slashes and we should be good!
    var path = (pathPrefix + '/' + route.path).replace(/\/+/g, '/');

    var clone = (0, _assign2.default)({}, route);

    clone.path = path;

    var boundAbsolutizePathFunc = internals.absolutizePath.bind(null, path);

    if (clone.childRoutes) {
        clone.childRoutes = clone.childRoutes.map(boundAbsolutizePathFunc);
    }

    return clone;
};

internals.buildRoutesFromAbsolutePaths = function () {

    // Build backwards, and split by slashes
};

internals.reformatRoutes = function (routes) {

    // For react-router v4, routes with params (:myId for example)
    // will only match if they are siblings to their parent routes.

    // The parent routes will also need to be set to exact: true
    // in order for these to match

    // This may have something to do with the `Switch` component
    // or just how the v4 router is setup, I'm unsure at the moment

    if (route.childRoutes) {
        var _internals$getRoutesW = internals.getRoutesWithParams(route.childRoutes),
            routesWithParams = _internals$getRoutesW.routesWithParams,
            routesWithoutParams = _internals$getRoutesW.routesWithoutParams;

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

internals.renderRoute = function (pathPrefix, route) {

    // Remove any double slashes and we should be good!
    var path = ('/' + pathPrefix + '/' + route.path).replace(/\/+/g, '/');

    var boundPathPrefixRenderFunc = internals.renderRoute.bind(null, path);

    if (!route.component) {
        // Fail with a useful error msg & info to help debugging
        console.log(route);
        throw new Error('^^^^Component is falsy for route ' + path + ' logged above^^^^');
    }

    return React.createElement(Route, {
        exact: route.exact,
        key: path,
        path: path,
        strict: route.strict,
        render: function render(props) {

            return React.createElement(
                internals.routeComponentLifecycleWrapper,
                (0, _extends3.default)({}, props, { route: route }),
                React.createElement(
                    route.component,
                    (0, _extends3.default)({}, props, { route: route }),
                    route.childRoutes && route.childRoutes.length && React.createElement(
                        Switch,
                        null,
                        route.childRoutes.map(boundPathPrefixRenderFunc)
                    )
                )
            );
        }
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

            var childRoutes = [].concat(parentRoute.childRoutes);
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

    console.log('flattenedChildRoutes', flattenedChildRoutes);

    console.log('flatty', flattenArray(flattenedChildRoutes));

    // console.log(internals.absolutizePath('/', routes[0]));

    // const boundReformatFunc = internals.reformatRoutes.bind(null, null);
    // console.log(routes.map(boundReformatFunc));

    var boundRenderFunc = internals.renderRoute.bind(null, '/');

    return React.createElement(
        Switch,
        null,
        routes.map(boundRenderFunc)
    );
};

// This is useful for server-side rendering

var computeMatch = Router.prototype.computeMatch;


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