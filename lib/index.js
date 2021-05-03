const React = require('react');
const PropTypes = require('prop-types');
const { Switch, Route, Redirect } = require('react-router');

const internals = {};

exports.Routes = class Routes extends React.Component {

    render() {

        const { routes } = this.props;
        const renderRoute = internals.renderRoute('/');

        return Array.isArray(routes) ?
            <Switch>{routes.map(renderRoute)}</Switch> :
            renderRoute(routes);
    }
};

exports.Routes.propTypes = {
    routes: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.arrayOf(PropTypes.object)
    ]).isRequired
};

internals.renderRoute = (basePath) => {

    return (route) => {

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
        }

        const normalizedPath = internals.concatPaths(basePath, route.path);
        const renderRoute = internals.renderRoute(normalizedPath);
        const RouteComponent = route.component || route.render;
        const { RouteComponentLifecycleWrapper } = internals;

        return (
            <Route
                key={route.path}
                path={normalizedPath}
                exact={route.exact}
                strict={route.strict}
                sensitive={route.sensitive}
                render={(props) => {

                    const switcher = route.childRoutes ?
                        <Switch children={route.childRoutes.map(renderRoute)} /> :
                        null;

                    const routeComponent = RouteComponent ?
                        <RouteComponent {...props} route={route} children={switcher} /> :
                        switcher;

                    return RouteComponentLifecycleWrapper.nonTrivial(route) ?
                        <RouteComponentLifecycleWrapper {...props} route={route} children={routeComponent} /> :
                        routeComponent;
                }}
            />
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

internals.concatPaths = (base, path) => {

    base = base.endsWith('/') ? base.slice(0, -1) : base; // /my-path/ -> /my-path
    path = path.startsWith('/') ? path.slice(1) : path;   // /my-path -> my-path

    return `${base}/${path}`;
};
