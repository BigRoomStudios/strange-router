'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { Routes, Route, Redirect } = require('react-router');

const internals = {};

exports.AppRoutes = class AppRoutes extends React.Component {

    render() {

        const { routes } = this.props;
        const renderRoute = internals.renderRoute('/');

        return Array.isArray(routes) ?
            <Routes>{routes.map((route) => renderRoute({ route, withRedirect: true }))}</Routes> :
            renderRoute({ route: routes });
    }
};

exports.AppRoutes.propTypes = {
    routes: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.arrayOf(PropTypes.object)
    ]).isRequired
};

internals.renderRoute = (basePath) => {

    return ({ route, withRedirect = true }) => {

        if (route.redirect) {

            // Redirect is special and must be exclusive of other props
            const { redirect, ...rest } = route;

            if (Object.keys(rest).length !== 0) {
                throw new Error(`No other properties are allowed alongside "redirect" in route configuration. Check childRoutes of "${basePath}".`);
            }

            const { from, to } = redirect;
            const redirectProps = { ...redirect };

            if (typeof from === 'string') {
                // redirect.from must be relative
                redirectProps.from = internals.concatPaths(from);
            }

            if (typeof to === 'string') {
                // If redirect.to is absolute, leave it be. Otherwise make it relative
                redirectProps.to = to.startsWith('/') ? to : internals.concatPaths(to);
            }
            else if (to && typeof to.pathname === 'string') {
                // to is an object
                redirectProps.to = {
                    ...redirectProps.to,
                    pathname: to.pathname.startsWith('/') ? to.pathname : internals.concatPaths(to.pathname)
                };
            }

            // withRedirect means there's a redirect outside of a switch statement (not nested redirect)
            // which we'll only render while looping through routes array
            // other than that, redirect inside childRoutes will be using path (react-router v5.1)
            if (withRedirect) {
                return <Redirect {...redirectProps} />;
            }

            const redirectTo = typeof redirectProps.to === 'string' ? redirectProps.to : { ...redirectProps.to };

            return <Route path={redirectProps?.from} render={() => <Redirect to={redirectTo}/>}/>;
        }

        const normalizedPath = internals.concatPaths(route.path, route.exact);
        const renderRoute = internals.renderRoute(normalizedPath);
        const RouteComponent = route.element || route.render;
        const { RouteComponentLifecycleWrapper } = internals;

        const Element = RouteComponentLifecycleWrapper.nonTrivial(route) ?
            <RouteComponentLifecycleWrapper route={route} element={RouteComponent} /> :
            RouteComponent;

        return (
            <Route
                key={route.path}
                path={normalizedPath}
                strict={route.strict}
                sensitive={route.sensitive}
                element={Element}
            >
                {route.childRoutes.map((childRoute) => renderRoute({ route: childRoute }))}
            </Route>
        );
    };
};

internals.RouteComponentLifecycleWrapper = class RouteComponentLifecycleWrapper extends React.PureComponent {

    constructor(props) {

        super();

        const { route } = props;

        if (route.componentDidCatch) {
            this.componentDidCatch = (err, info) => route.componentDidCatch({ err, info, ...this.props });
        }

        if (route.onWillMount) {
            this.componentWillMount = () => route.onWillMount(this.props);
        }

        if (route.onDidMount) {
            this.componentDidMount = () => route.onDidMount(this.props);
        }

        if (route.onWillUnmount) {
            this.componentWillUnmount = () => route.onWillUnmount(this.props);
        }
    }

    render() {

        return this.props.children;
    }
};

internals.RouteComponentLifecycleWrapper.propTypes = {
    route: PropTypes.object.isRequired
};

internals.RouteComponentLifecycleWrapper.nonTrivial = (route) => {

    return route.componentDidCatch ||
        route.onWillMount ||
        route.onDidMount ||
        route.onWillUnmount;
};

internals.concatPaths = (path, exact = false) => {

    // base = base.endsWith('/') ? base.slice(0, -1) : base; // /my-path/ -> /my-path
    path = path.startsWith('/') ? path.slice(1) : path;   // /my-path -> my-path

    // return `${base}/${path}`;
    return `${path}${exact ? '/*' : ''}`;
};
