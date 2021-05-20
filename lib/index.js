'use strict';

const React = require('react');
const T = require('prop-types');
const { Switch, Route, Redirect } = require('react-router');

const internals = {};

exports.Routes = function Routes(props) {

    const { routes } = props;
    const { keyForRoute, renderRoute } = internals;

    const renderBase = renderRoute('/');

    if (Array.isArray(routes)) {
        return (
            <Switch>
                {routes.map(renderBase).map((route) => {

                    return React.cloneElement(route, { key: keyForRoute(route) });
                })}
            </Switch>
        );
    }

    return renderBase(routes);
};

exports.Routes.propTypes = {
    routes: T.oneOfType([
        T.object,
        T.arrayOf(T.object)
    ]).isRequired
};

internals.keyForRoute = (route) => {

    return String(
        route.path
        + !!route.exact
        + !!route.strict
        + !!route.sensitive
        + !!route.childRoutes
    );
};

internals.handleRedirect = (basePath, route) => {

    // Redirect is special and must be exclusive of other props
    const { redirect, ...rest } = route;

    if (Object.keys(rest).length !== 0) {
        throw new Error(`No other properties are allowed alongside "redirect" in route configuration. Check childRoutes of "${basePath}".`);
    }

    const { from, to } = redirect;
    const redirectProps = { ...redirect };

    if (typeof from === 'string') {
        // redirect.from must be relative
        redirectProps.from = internals.concatPaths(basePath, from);
    }

    if (typeof to === 'string') {
        // If redirect.to is absolute, leave it be. Otherwise make it relative
        redirectProps.to = to.startsWith('/') ? to : internals.concatPaths(basePath, to);
    }
    else if (to && typeof to.pathname === 'string') {
        // to is an object
        redirectProps.to = {
            ...redirectProps.to,
            pathname: to.pathname.startsWith('/') ? to.pathname : internals.concatPaths(basePath, to.pathname)
        };
    }

    return <Redirect {...redirectProps} />;
};

internals.renderRoute = function renderRoute(basePath) {

    return (route) => {

        const { handleRedirect } = internals;

        if (route.redirect) {
            return handleRedirect(basePath, route);
        }

        const normalizedPath = internals.concatPaths(basePath, route.path);
        const renderRouteFromPath = internals.renderRoute(normalizedPath);
        const RouteComponent = route.component || route.render;
        const { RouteComponentLifecycleWrapper } = internals;

        return (
            <Route
                key={normalizedPath}
                path={normalizedPath}
                exact={route.exact}
                strict={route.strict}
                sensitive={route.sensitive}
                render={(props) => {

                    const switcher = route.childRoutes
                        ? <Switch>{route.childRoutes.map(renderRouteFromPath)}</Switch>
                        : null;

                    const routeComponent = RouteComponent
                        ? <RouteComponent {...props} route={route} children={switcher} />
                        : switcher;

                    if (RouteComponentLifecycleWrapper.trivial(route)) {
                        return routeComponent;
                    }

                    return (
                        <RouteComponentLifecycleWrapper {...props} route={route}>
                            {routeComponent}
                        </RouteComponentLifecycleWrapper>
                    );
                }}
            />
        );
    };
};

const { useEffect, useState } = React;

internals.RouteComponentLifecycleWrapper = function RouteComponentLifecycleWrapper(props) {

    const { route, ...rest } = props;
    const { props: routeProps } = route;

    const withRouteProps = { route, ...routeProps, ...rest };

    let {
        onMount,
        onUnmount
    } = route;

    const { pre } = route;

    const noop = () => null;

    onMount = onMount || noop;
    onUnmount = onUnmount || noop;

    const [preResolved, setPreResolved] = useState(false);

    useEffect(() => {

        const runPre = async (func) => {

            await func(withRouteProps);
            onMount(withRouteProps);
            setPreResolved(true);
        };

        if (!pre) {
            onMount(withRouteProps);
            setPreResolved(true);
        }
        else {
            runPre(pre);
        }

        return function cleanup() {

            onUnmount(withRouteProps);
        };
    }, []);

    const { fallback, children } = withRouteProps;

    return !preResolved ? (fallback || null) : children;
};

internals.RouteComponentLifecycleWrapper.propTypes = {
    route: T.object.isRequired
};

internals.RouteComponentLifecycleWrapper.trivial = (route) => {

    return !route.props && !route.pre && !route.onMount && !route.onUnmount;
};

internals.concatPaths = (base, path) => {

    base = base.endsWith('/') ? base.slice(0, -1) : base; // /my-path/ -> /my-path
    path = path.startsWith('/') ? path.slice(1) : path;   // /my-path -> my-path

    return `${base}/${path}`;
};
