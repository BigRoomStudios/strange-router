const React = require('react');
const T = require('prop-types');

const { default: Switch } = require('react-router-dom/Switch');
const { default: Route } = require('react-router-dom/Route');
const { default: RedirectComponent } = require('react-router-dom/Redirect');

const internals = {};

exports.buildRoutes = (routes) => {

    return (
        <Switch>
            {routes.map(internals.renderRoute('/'))}
        </Switch>
    );
};

internals.renderRoute = (basePath) => {

    return (route) => {

        if (route.redirect) {

            // Redirect is special and must be exclusive of other props
            const { redirect, ...rest } = route;

            if (Object.keys(rest).length !== 0) {
                throw new Error(`No other properties are allowed alongside "redirect" in route configuration. Check childRoutes of "${basePath}"`);
            }

            if (redirect.from) {
                if (redirect.from === '/') {

                    redirect.from = basePath;

                    // For some reason, redirect.from slash paths do not prepend the entire basePath to redirect's 'to'. It cuts off the last piece so we make it absolute here

                    if (!redirect.to.startsWith(basePath)) {
                        redirect.to = internals.concatPaths(basePath, redirect.to);
                    }
                }
                else {
                    // redirect.from should not be an absolute path, it doesn't make much sense to redirect from an absolute path in a nested route situation
                    // Ex: inside { path: '/my/path' } there's a { redirect: { from: '/another/weird/path', to: '...' } } -- which doesn't work. 'from' will never match since the redirect won't be rendered at '/another/weird/path'.

                    // redirect.from is assumed to be relative

                    if (!redirect.from.startsWith(basePath)) {
                        redirect.from = internals.concatPaths(basePath, redirect.from);
                    }
                }
            }

            return <RedirectComponent {...redirect} />;
        }

        const normalizedPath = internals.concatPaths(basePath, route.path);
        const RouteComponent = route.component;

        return (
            <Route
                exact={route.exact}
                key={route.path}
                path={normalizedPath}
                strict={route.strict}
                render={(props) => {

                    const switcher = route.childRoutes
                        ?
                            <Switch>
                                {route.childRoutes.map(internals.renderRoute(normalizedPath))}
                            </Switch>
                        :
                            null;

                    return (
                        <internals.routeComponentLifecycleWrapper {...props} route={route}>
                            {RouteComponent
                                ?
                                    <RouteComponent {...props} route={route}>{switcher}</RouteComponent>
                                :
                                    switcher
                            }
                        </internals.routeComponentLifecycleWrapper>
                    );
                }}
            />
        );
    };
};

internals.routeComponentLifecycleWrapper = class RouteComponentLifecycleWrapper extends React.PureComponent {

    static propTypes = {
        match: T.object,
        location: T.object,
        history: T.object,
        route: T.object
    }

    constructor(props) {

        super();

        const { route, match, location, history } = props;

        if (typeof route.componentDidCatch === 'function') {
            this.componentDidCatch = (err, info) => {

                route.componentDidCatch({ err, info, route, match, location, history });
            }
        }
    }

    componentWillMount() {

        const { route, match, location, history } = this.props;

        if (typeof route.onWillMount === 'function') {
            route.onWillMount({ route, match, location, history });
        }
    }

    componentDidMount() {

        const { route, match, location, history } = this.props;

        if (typeof route.onDidMount === 'function') {
            route.onDidMount({ route, match, location, history });
        }
    }

    componentWillUnmount() {

        const { route, match, location, history } = this.props;

        if (typeof route.onWillUnmount === 'function') {
            route.onWillUnmount({ route, match, location, history });
        }
    }

    render() {

        return this.props.children;
    }
};

internals.concatPaths = (base, path) => {

    base = base.endsWith('/') ? base.slice(0, -1) : base; // /my-path/ -> /my-path
    path = path.startsWith('/') ? path.slice(1) : path;   // /my-path -> my-path

    return `${base}/${path}`;
};

internals.flatten = (arr) => [].concat(...arr);
