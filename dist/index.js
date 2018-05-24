'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

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

var _require = require('react-router-dom/Switch'),
    Switch = _require.default;

var _require2 = require('react-router-dom/Route'),
    Route = _require2.default;

var _require3 = require('react-router-dom/Redirect'),
    RedirectComponent = _require3.default;

var internals = {};

exports.Routes = (_temp = _class = function (_React$PureComponent) {
    (0, _inherits3.default)(Routes, _React$PureComponent);

    function Routes() {
        (0, _classCallCheck3.default)(this, Routes);
        return (0, _possibleConstructorReturn3.default)(this, (Routes.__proto__ || (0, _getPrototypeOf2.default)(Routes)).apply(this, arguments));
    }

    (0, _createClass3.default)(Routes, [{
        key: 'render',
        value: function render() {
            var routes = this.props.routes;


            return React.createElement(
                Switch,
                null,
                routes.map(internals.renderRoute('/'))
            );
        }
    }]);
    return Routes;
}(React.PureComponent), _class.propTypes = {
    routes: T.array.isRequired
}, _temp);

internals.renderRoute = function (basePath) {

    return function (route) {

        if (route.redirect) {

            // Redirect is special and must be exclusive of other props
            var redirect = route.redirect,
                rest = (0, _objectWithoutProperties3.default)(route, ['redirect']);


            if ((0, _keys2.default)(rest).length !== 0) {
                throw new Error('No other properties are allowed alongside "redirect" in route configuration. Check childRoutes of "' + basePath + '"');
            }

            var redirectClone = (0, _extends3.default)({}, redirect);

            if (typeof redirectClone.from === 'string') {
                // redirect.from must be relative
                redirectClone.from = internals.concatPaths(basePath, redirectClone.from);
            }

            if (typeof redirectClone.to === 'string') {
                // If redirect.to is absolute, leave it be. Otherwise make it relative
                redirectClone.to = redirectClone.to.startsWith('/') ? redirectClone.to : internals.concatPaths(basePath, redirectClone.to);
            } else {
                // to is an object
                if (typeof redirectClone.to.pathname === 'string') {
                    var pathname = redirectClone.to.pathname.startsWith('/') ? redirectClone.to.pathname : internals.concatPaths(basePath, redirectClone.to.pathname);
                    redirectClone.to = (0, _extends3.default)({}, redirectClone.to, {
                        pathname: pathname
                    });
                }
            }

            return React.createElement(RedirectComponent, redirectClone);
        }

        var normalizedPath = internals.concatPaths(basePath, route.path);
        var RouteComponent = route.component;

        return React.createElement(Route, {
            exact: route.exact,
            key: route.path,
            path: normalizedPath,
            strict: route.strict,
            render: function render(props) {

                var switcher = route.childRoutes ? React.createElement(
                    Switch,
                    null,
                    route.childRoutes.map(internals.renderRoute(normalizedPath))
                ) : null;

                return React.createElement(
                    internals.routeComponentLifecycleWrapper,
                    (0, _extends3.default)({}, props, { route: route }),
                    RouteComponent ? React.createElement(
                        RouteComponent,
                        (0, _extends3.default)({}, props, { route: route }),
                        switcher
                    ) : switcher
                );
            }
        });
    };
};

internals.routeComponentLifecycleWrapper = (_temp2 = _class2 = function (_React$PureComponent2) {
    (0, _inherits3.default)(RouteComponentLifecycleWrapper, _React$PureComponent2);

    function RouteComponentLifecycleWrapper(props) {
        (0, _classCallCheck3.default)(this, RouteComponentLifecycleWrapper);

        var _this2 = (0, _possibleConstructorReturn3.default)(this, (RouteComponentLifecycleWrapper.__proto__ || (0, _getPrototypeOf2.default)(RouteComponentLifecycleWrapper)).call(this));

        var route = props.route,
            match = props.match,
            location = props.location,
            history = props.history;


        if (typeof route.componentDidCatch === 'function') {
            _this2.componentDidCatch = function (err, info) {

                route.componentDidCatch({ err: err, info: info, route: route, match: match, location: location, history: history });
            };
        }
        return _this2;
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
                route.onWillMount({ route: route, match: match, location: location, history: history });
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
                route.onDidMount({ route: route, match: match, location: location, history: history });
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
                route.onWillUnmount({ route: route, match: match, location: location, history: history });
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

internals.concatPaths = function (base, path) {

    base = base.endsWith('/') ? base.slice(0, -1) : base; // /my-path/ -> /my-path
    path = path.startsWith('/') ? path.slice(1) : path; // /my-path -> my-path

    return base + '/' + path;
};

internals.flatten = function (arr) {
    var _ref;

    return (_ref = []).concat.apply(_ref, (0, _toConsumableArray3.default)(arr));
};