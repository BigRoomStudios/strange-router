'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { Routes, Route, Navigate, Outlet } = require('react-router');

const internals = {};

exports.AppRoutes = class AppRoutes extends React.Component {

    render() {

        const { routes } = this.props;
        const { renderRoute } = internals;

        return Array.isArray(routes) ?
            <Routes>
                {routes.map((route) => renderRoute(route))}
            </Routes> :
            <Routes>
                {renderRoute(routes)}
            </Routes>;
    }
};

exports.AppRoutes.propTypes = {
    routes: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.arrayOf(PropTypes.object)
    ]).isRequired
};

internals.renderRoute = (route) => {

    if (route.redirect) {

        // Redirect is special and must be exclusive of other props
        const { redirect, ...rest } = route;

        if (Object.keys(rest).length !== 0) {
            throw new Error(`No other properties are allowed alongside "redirect" in route configuration. Check childRoutes of "${route.path}".`);
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

        return <Route path='*' element={<Navigate to={redirectProps.to} replace/>}/>;
    }

    const normalizedPath = internals.concatPaths(route);
    const { renderRoute, withOutlet } = internals;
    const RouteComponent = route.component || route.render;
    const { RouteComponentLifecycleWrapper } = internals;

    const switcher = route.childRoutes ? withOutlet(RouteComponent) : RouteComponent;
    const Component = RouteComponentLifecycleWrapper.nonTrivial(route) ?
        <RouteComponentLifecycleWrapper route={route} children={switcher}/> :
        switcher;

    return (
        <Route
            key={route.path}
            path={normalizedPath}
            strict={route.strict}
            sensitive={route.sensitive}
            element={<Component/>}
        >
            {route?.childRoutes?.map((childRoute) => renderRoute(childRoute))}
        </Route>
    );
};

internals.withOutlet = function withOutlet(WrappedComponent) {

    return function WithOutletComponent(props) {

        return <WrappedComponent {...props}>
            <Outlet/>
        </WrappedComponent>;
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

internals.concatPaths = (route) => {

    const { path, exact, childRoutes } = route;

    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;   // /my-path -> my-path

    if (childRoutes && exact) {
        return `${normalizedPath}/*`; // parent route with * signifies deep matching
    }

    return normalizedPath;
};
