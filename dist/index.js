'use strict';

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

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

internals.routeComponentWrapper = (_temp2 = _class2 = function (_React$PureComponent2) {
    (0, _inherits3.default)(RouteWrapper, _React$PureComponent2);

    function RouteWrapper() {
        (0, _classCallCheck3.default)(this, RouteWrapper);
        return (0, _possibleConstructorReturn3.default)(this, (RouteWrapper.__proto__ || (0, _getPrototypeOf2.default)(RouteWrapper)).apply(this, arguments));
    }

    (0, _createClass3.default)(RouteWrapper, [{
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
    return RouteWrapper;
}(React.PureComponent), _class2.propTypes = {
    match: T.object,
    location: T.object,
    history: T.object,
    route: T.object
}, _temp2);

internals.renderRoutes = function (routes) {

    var renderRouteRecursive = function renderRouteRecursive(pathPrefix, route) {

        // These relative paths seem to require a slash in front

        // Remove any double slashes and we should be good!
        var path = (pathPrefix + '/' + route.path).replace(/\/+/g, '/');

        console.log('pathPrefix', pathPrefix);
        console.log('path', path);

        var isLeafRoute = true;

        if (!route.childRoutes) {
            isLeafRoute = true;
        }

        var boundRenderFunc = renderRouteRecursive.bind(null, path);

        return React.createElement(Route, {
            exact: route.exact,
            key: path,
            path: path,
            strict: route.strict,
            render: function render(props) {
                return React.createElement(
                    internals.routeComponentWrapper,
                    (0, _extends3.default)({}, props, { route: route }),
                    React.createElement(
                        route.component,
                        (0, _extends3.default)({}, props, { route: route }),
                        route.childRoutes && route.childRoutes.length && React.createElement(
                            Switch,
                            null,
                            route.childRoutes.map(boundRenderFunc)
                        )
                    )
                );
            }
        });
    };

    var boundRenderFunc = renderRouteRecursive.bind(null, '/');

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