const React = require('react');
const T = require('prop-types');

const { default: Switch } = require('react-router-dom/Switch');
const { default: Route } = require('react-router-dom/Route');
const { default: Redirect } = require('react-router-dom/Redirect');

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

        const routeRedirect = route.redirect ? {...route.redirect} : null;

        if (routeRedirect && routeRedirect.from) {
            routeRedirect.from = internals.concatPaths(basePath, routeRedirect.from);
        }

        const redirect = routeRedirect
            ?
                <Redirect {...routeRedirect} />
            :
                null;

        if (!route.path && routeRedirect) {
            return redirect;
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
                                {redirect}
                            </Switch>
                        :
                            redirect;

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

                route.componentDidCatch(err, info, route, match, location, history);
            }
        }
    }

    componentWillMount() {

        const { route, match, location, history } = this.props;

        if (typeof route.onWillMount === 'function') {
            route.onWillMount(route, match, location, history);
        }
    }

    componentDidMount() {

        const { route, match, location, history } = this.props;

        if (typeof route.onDidMount === 'function') {
            route.onDidMount(route, match, location, history);
        }
    }

    componentWillUnmount() {

        const { route, match, location, history } = this.props;

        if (typeof route.onWillUnmount === 'function') {
            route.onWillUnmount(route, match, location, history);
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
