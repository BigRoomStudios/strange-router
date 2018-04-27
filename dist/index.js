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

    var rootSlashRoutes = [];
    var rest = [];

    // At the moment, root slash route components will be ignored.
    routes.forEach(function (r) {
        return r.path === '/' ? rootSlashRoutes.push(r) : rest.push(r);
    });

    var rootSlashChildren = rootSlashRoutes.map(function (r) {
        return r.childRoutes ? r.childRoutes : [];
    }).reduce(function (collector, r) {
        return collector.concat(r);
    }, []);

    var toRender = rest.concat(rootSlashChildren);

    return React.createElement(
        Switch,
        null,
        toRender.sort(internals.sortRoutes).map(internals.rRenderRoute('/'))
    );
};

internals.rRenderRoute = function (basePath) {

    return function (route) {

        var updatedPath = String(basePath + '/' + route.path).replace(/\/+/g, '/'); // Remove duplicate slashes
        var RouteComponent = route.component || 'div';

        return React.createElement(Route, {
            exact: route.exact,
            key: route.path,
            path: updatedPath,
            strict: route.strict,
            render: function render(props) {

                console.log('props', props);

                return React.createElement(
                    internals.routeComponentLifecycleWrapper,
                    (0, _extends3.default)({}, props, { route: route }),
                    React.createElement(
                        RouteComponent,
                        (0, _extends3.default)({}, props, { route: route }),
                        route.childRoutes && route.childRoutes.length !== 0 && React.createElement(
                            Switch,
                            null,
                            route.childRoutes.sort(internals.sortRoutes).map(internals.rRenderRoute(updatedPath))
                        )
                    )
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

internals.sortRoutes = function (a, b) {

    // Sort routes by greater specificity (more slashes) on top, less specific on bottom
    // Also, param routes go on the bottom, they will prevent everything below them from matching

    var aPath = ('/' + a.path).replace(/\/+/g, '/');
    var bPath = ('/' + b.path).replace(/\/+/g, '/');

    var pathASplitSlash = aPath.split('/').filter(function (pathPiece) {
        return pathPiece !== '';
    });
    var pathBSplitSlash = bPath.split('/').filter(function (pathPiece) {
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