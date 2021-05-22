'use strict';

const React = require('react');
const T = require('prop-types');
const { Switch, Route, Redirect } = require('react-router');

const internals = {};

exports.Routes = function Routes(props) {

    const { routes } = props;
    const { keyForRoute, renderRoute, cloneWithProps } = internals;

    const renderBase = renderRoute('/');

    if (Array.isArray(routes)) {
        return (
            <Switch>
                {routes.map(renderBase).map((route) => {

                    return cloneWithProps(route, { key: keyForRoute(route) });
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
        + String(route.props)
        + !!route.exact
        + !!route.strict
        + !!route.sensitive
        + !!route.childRoutes
    );
};

internals.cloneWithProps = (element, props) => {

    if (!element) {
        return null;
    }

    return React.cloneElement(element, props);
};

internals.handleRedirect = function HandleRedirect(basePath, route) {

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

internals.renderRoute = function RenderPath(basePath) {

    return function RenderRoute(route) {

        const { handleRedirect } = internals;

        if (route.redirect) {
            return handleRedirect(basePath, route);
        }

        const {
            path,
            exact,
            strict,
            sensitive,
            component: RouteComponent,
            wrapFallbackWithComponent
        } = route;

        const normalizedPath = internals.concatPaths(basePath, path);
        // 'renderRouteFromPath' — It's a recursion excursion.`
        const renderRouteFromPath = internals.renderRoute(normalizedPath);

        const { RouteComponentLifecycleWrapper } = internals;

        return (
            <Route
                key={normalizedPath}
                path={normalizedPath}
                exact={exact}
                strict={strict}
                sensitive={sensitive}
                render={(props) => {

                    const routerProps = {
                        ...props,
                        ...route.props,
                        route,
                        normalizedPath
                    };

                    const render = function Render(renderProps) {

                        const componentProps = { ...routerProps, ...renderProps };

                        return (
                            <RouteComponent {...componentProps}>
                                {route.childRoutes && (
                                    <Switch>
                                        {route.childRoutes.map(renderRouteFromPath)}
                                    </Switch>
                                )}
                            </RouteComponent>
                        );
                    };

                    if (RouteComponentLifecycleWrapper.isTrivialRoute(route)) {
                        return render();
                    }

                    const renderFallback = function RenderFallback(renderProps) {

                        const Fallback = route.fallback || (route.props ? route.props.fallback : null) || null;

                        const componentProps = { ...routerProps, ...renderProps };

                        if (Fallback) {
                            return !wrapFallbackWithComponent ? <Fallback {...componentProps} /> : (
                                <RouteComponent {...componentProps}>
                                    <Fallback {...componentProps} />
                                </RouteComponent>
                            );
                        }

                        return <RouteComponent {...routerProps} />;
                    };

                    return (
                        <RouteComponentLifecycleWrapper
                            route={route}
                            routerProps={routerProps}
                            // eslint-disable-next-line react/jsx-no-bind
                            render={render}
                            // eslint-disable-next-line react/jsx-no-bind
                            renderFallback={renderFallback}
                        />
                    );
                }}
            />
        );
    };
};

const { useEffect, useState, useRef } = React;

internals.RouteComponentLifecycleWrapper = function RouteComponentLifecycleWrapper(props) {

    // Freeze props to avoid rerender bugs
    const propsSnapshotRef = useRef();
    useEffect(() => {

        propsSnapshotRef.current = props;
    });

    const [isPreResolved, setIsPreResolved] = useState(false);

    useEffect(() => {

        const { route, routerProps } = propsSnapshotRef.current;

        let {
            onMount,
            onUnmount
        } = route;

        const noop = () => null;

        onMount = onMount || noop;
        onUnmount = onUnmount || noop;

        const runPre = async (func) => {

            await func(routerProps);
            onMount(routerProps);
            setIsPreResolved(true);
        };

        const { pre } = route;

        if (pre) {
            runPre(pre);
        }
        else {
            onMount(routerProps);
            setIsPreResolved(true);
        }

        return function cleanup() {

            onUnmount(routerProps);
        };
    }, [setIsPreResolved]);

    // We know these 2 funcs specifically won't change over time
    const { renderFallback, render, ...rest } = props;

    return !isPreResolved ? renderFallback(rest) : render(rest);
};

internals.RouteComponentLifecycleWrapper.propTypes = {
    route: T.object.isRequired
};

internals.RouteComponentLifecycleWrapper.isTrivialRoute = (route) => {

    if (!route) {
        return true;
    }

    return !route.pre && !route.onMount && !route.onUnmount;
};

internals.concatPaths = (base, path) => {

    base = base.endsWith('/') ? base.slice(0, -1) : base; // /my-path/ -> /my-path
    path = path.startsWith('/') ? path.slice(1) : path;   // /my-path -> my-path

    return `${base}/${path}`;
};
