'use strict';

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

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

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

    // Here we're replacing root slash routes (root config route with { ...path: '/' })
    // with their children if available because at root level a slash route is the same
    // as a param route ({ ...path: ':myParam' })

    var rootSlashRoutes = {};

    routes.forEach(function (r, i) {

        if (r.path === '/') {
            rootSlashRoutes[String(i)] = r; // These routes will be keyed by their indices
        }
    });

    var toRender = [].concat((0, _toConsumableArray3.default)(routes));

    for (var i = routes.length; i > 1; --i) {

        var route = rootSlashRoutes[i];
        if (route && route.childRoutes) {
            toRender.splice.apply(toRender, [i, 1].concat((0, _toConsumableArray3.default)(route.childRoutes)));
        }
    }

    return React.createElement(
        Switch,
        null,
        toRender.map(internals.rRenderRoute('/'))
    );
};

internals.rRenderRoute = function (basePath) {

    return function (route) {

        var normalizedPath = internals.concatPaths(basePath, route.path);
        var RouteComponent = route.component;

        return React.createElement(Route, {
            exact: route.exact,
            key: route.path,
            path: normalizedPath,
            strict: route.strict,
            render: function render(props) {

                var childSwitcher = route.childRoutes ? React.createElement(
                    Switch,
                    null,
                    route.childRoutes.map(internals.rRenderRoute(normalizedPath))
                ) : null;

                return React.createElement(
                    internals.routeComponentLifecycleWrapper,
                    (0, _extends3.default)({}, props, { route: route }),
                    RouteComponent ? React.createElement(
                        RouteComponent,
                        (0, _extends3.default)({}, props, { route: route }),
                        childSwitcher
                    ) : childSwitcher
                );
            }
        });
    };
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

internals.concatPaths = function (base, path) {

    base = base.endsWith('/') ? base.slice(0, -1) : base; // /my-path/ -> /my-path
    path = path.startsWith('/') ? path.slice(1) : path; // /my-path -> my-path

    return base + '/' + path;
};