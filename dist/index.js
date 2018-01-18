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

internals.routeWrapper = (_temp2 = _class2 = function (_React$PureComponent2) {
    (0, _inherits3.default)(RouteWrapper, _React$PureComponent2);

    function RouteWrapper() {
        (0, _classCallCheck3.default)(this, RouteWrapper);
        return (0, _possibleConstructorReturn3.default)(this, (RouteWrapper.__proto__ || (0, _getPrototypeOf2.default)(RouteWrapper)).apply(this, arguments));
    }

    (0, _createClass3.default)(RouteWrapper, [{
        key: 'componentDidMount',
        value: function componentDidMount() {}
    }, {
        key: 'render',
        value: function render() {}
    }]);
    return RouteWrapper;
}(React.PureComponent), _class2.propTypes = {
    route: T.object
}, _temp2);

internals.renderRoutes = function (routes) {

    var renderRouteRecursive = function renderRouteRecursive(route, i) {

        // These relative paths seem to require a slash in front

        var path = String(route.path);
        if (path && path[0] !== '/') {
            // path = `/${path}`;
        }

        var isLeafRoute = true;

        if (route.childRoutes) {
            isLeafRoute = false;
        }

        var exact = route.exact || false;

        if (isLeafRoute) {
            exact = true;
        }

        // if (path && path.includes(':') || !route.childRoutes) {
        // exact = false;
        // }

        return React.createElement(Route, {
            exact: exact,
            key: i,
            path: path,
            strict: route.strict,
            render: function render(props) {
                return React.createElement(
                    route.component,
                    (0, _extends3.default)({}, props, { route: route }),
                    route.childRoutes && route.childRoutes.length && React.createElement(
                        Switch,
                        null,
                        route.childRoutes.map(renderRouteRecursive)
                    )
                );
            }
        });
    };

    console.log('routes', routes);

    return React.createElement(
        Switch,
        null,
        routes.map(renderRouteRecursive)
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