'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _class, _temp;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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

// This gets incremented and used as a the `key` prop for each route
internals.routeCount = 0;

exports.Router = (_temp = _class = function (_React$PureComponent) {
    _inherits(StrangeRouter, _React$PureComponent);

    function StrangeRouter() {
        _classCallCheck(this, StrangeRouter);

        return _possibleConstructorReturn(this, (StrangeRouter.__proto__ || Object.getPrototypeOf(StrangeRouter)).apply(this, arguments));
    }

    _createClass(StrangeRouter, [{
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

internals.renderRoutes = function (routes) {

    var renderRouteRecursive = function renderRouteRecursive(route, i) {

        // These relative paths seem to require a slash in front

        var path = route.path;
        if (path[0] !== '/') {
            path = '/' + path;
        }

        return React.createElement(Route, {
            exact: route.exact,
            key: ++internals.routeCount,
            path: path,
            strict: route.strict,
            render: function render(props) {
                return React.createElement(
                    route.component,
                    _extends({}, props, { route: route }),
                    route.childRoutes && route.childRoutes.length && React.createElement(
                        Switch,
                        null,
                        route.childRoutes.map(renderRouteRecursive)
                    )
                );
            }
        });
    };

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