# strange-router

A module to aid bringing configurable routes to react-router v4

Lead Maintainer - [William Woodruff](https://github.com/wswoodruff)

## Usage

```bash
npm install strange-router
```

### Config

Configs have a recursive structure via `childRoutes`

Props:

`path`
  - Required if `redirect` is not set
  - Nested paths (via childRoutes) are prepended by their parent paths

`component`
  - Optional

`childRoutes`
  - Optional

`redirect`
  - Optional

Ex:

```js
const routes = [
    {
        path: 'first', // matches '/first'
        component: MyComponent,
        childRoutes: [
            {
                path: 'second', // matches '/first/second'
                childRoutes: [
                    { path: 'third', // matches '/first/second/third'
                        redirect: {
                            to: '/404'
                        }
                    }
                ]
            }
        ]
    },
    {
        path: '404',
        component: FourOFour
    }
];
```

### Integration
```js
const React = require('react');
const StrangeRouter = require('strange-router');
const { ConnectedRouter } = require('react-router-redux');

class App extends React.Component {

    static propTypes = {
        history: T.object.isRequired,
        routes: T.array.isRequired,
        store: T.object.isRequired
    }

    render() {

        const { history, routes, store } = this.props;

        return (
            <Provider store={store}>
                <ConnectedRouter history={history}>
                    {StrangeRouter.buildRoutes(routes)}
                </ConnectedRouter>
            </Provider>
        );
    }
};
```
