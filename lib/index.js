const React = require('react');
const T = require('prop-types');

const { default: MatchPath } = require('react-router-dom/matchPath');
const { ConnectedRouter } = require('react-router-redux');
const { default: Switch } = require('react-router-dom/Switch');
const { default: Route } = require('react-router-dom/Route');

const internals = {};

exports.Router = class StrangeRouter extends React.PureComponent {

    static propTypes = {
        history: T.object,
        routes: T.array.isRequired
    }

    render() {

        const { history, routes } = this.props;

        return (
            <ConnectedRouter
                history={history}>
                {internals.renderRoutes(routes)}
            </ConnectedRouter>
        );
    }
};

internals.renderRoutes = (routes) => {

    const renderRouteRecursive = (route, i) => {

        // These relative paths seem to require a slash in front

        let path = route.path;
        if (path[0] !== '/') {
            path = `/${path}`;
        }

        return (
            <Route
              exact={route.exact}
              key={i}
                path={path}
                strict={route.strict}
                render={(props) => (

                    <route.component {...props} route={route}>
                        {
                            route.childRoutes &&
                            route.childRoutes.length &&
                            <Switch>
                                {route.childRoutes.map(renderRouteRecursive)}
                            </Switch>
                        }
                    </route.component>
                )}
            />
        );
    };

    return (
        <Switch>
            {routes.map(renderRouteRecursive)}
        </Switch>
    );
};


// This is useful for server-side rendering

const { computeMatch } = ConnectedRouter.prototype;

exports.matchRoutes = (routes, pathname, branch = []) => {

    routes.some((route) => {

        const match = route.path
        ? MatchPath(pathname, route)
        : branch.length
        ? branch[branch.length - 1].match // use parent match
        : computeMatch(pathname); // use default "root" match

        if (match) {
            branch.push({ route, match });

            if (route.childRoutes) {
                exports.matchRoutes(route.childRoutes, pathname, branch);
            }
        }

        return match;
    });

    return branch;
};
