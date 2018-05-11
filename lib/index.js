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

            const redirectClone = { ...redirect };

            if (redirectClone.from) {
                // redirect.from must be relative
                redirectClone.from = internals.concatPaths(basePath, redirectClone.from);
            }

            if (typeof redirectClone.to === 'string') {
                // If redirect.to is absolute, leave it be. Otherwise make it relative
                redirectClone.to = redirectClone.to.startsWith('/') ? redirectClone.to : internals.concatPaths(basePath, redirectClone.to);
            }
            else {
                // to is an object
                redirectClone.to.pathname = redirectClone.to.pathname.startsWith('/') ? redirectClone.to.pathname : internals.concatPaths(basePath, redirectClone.to.pathname);
            }

            return <RedirectComponent {...redirectClone} />;
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
