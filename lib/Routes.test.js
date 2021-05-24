'use strict';

require('regenerator-runtime/runtime');

const React = require('react');
const { Router } = require('react-router-dom');
const { createMemoryHistory } = require('history');
const Testing = require('@testing-library/react');
const { Routes } = require('.');

const {
    screen,
    render,
    cleanup
} = Testing;

const {
    // debug,
    getByText
} = screen;

const renderWithRouter = (route, ui) => {

    // TODO figure out why this is needed. Without this,
    // previously rendered routes will stick around in the 'screen'
    cleanup();

    const history = createMemoryHistory();

    history.push(route);

    if (!ui || !React.isValidElement(ui)) {
        throw new Error('Must pass valid ui element');
    }

    return {
        history,
        ...render(
            ui,
            { wrapper: (props) => <Router {...props} history={history} /> }
        )
    };
};

it('renders without crashing with empty routes', () => {

    renderWithRouter('/', <Routes routes={[]} />);
});

it('renders a simple route', () => {

    renderWithRouter(
        '/',
        <Routes routes={{
            path: '/',
            component: () => 'Root route'
        }} />
    );

    expect(getByText('Root route')).toBeDefined();
});

it('renders different routes given an array of routes', () => {

    const routes = [
        {
            path: '/one',
            exact: true,
            component: () => 'Route one'
        },
        {
            path: '/two',
            exact: true,
            component: () => 'Route two'
        }
    ];

    renderWithRouter(
        '/one',
        <Routes routes={routes} />
    );

    expect(getByText('Route one')).toBeDefined();
    expect(() => getByText('Route two')).toThrow();

    renderWithRouter(
        '/two',
        <Routes routes={routes} />
    );

    expect(() => getByText('Route one')).toThrow();
    expect(getByText('Route two')).toBeDefined();
});

it('passes childRoute as "children" prop', () => {

    const routes = [
        {
            path: '/root',
            component: ({ children }) => (

                <div>
                    <div>Root route</div>
                    <div>{children}</div>
                </div>
            ),
            childRoutes: [
                {
                    path: '/nested',
                    component: () => 'Nested route'
                }
            ]
        }
    ];

    renderWithRouter(
        '/root',
        <Routes routes={routes} />
    );

    expect(getByText('Root route')).toBeDefined();
    expect(() => getByText('Nested route')).toThrow();

    renderWithRouter(
        '/root/nested',
        <Routes routes={routes} />
    );

    expect(getByText('Root route')).toBeDefined();
    expect(getByText('Nested route')).toBeDefined();
});

it('renders childRoutes many levels deep', () => {

    const routes = [
        {
            path: '/root',
            component: ({ children }) => (

                <div>
                    <div>Root route</div>
                    <div>{children}</div>
                </div>
            ),
            childRoutes: [
                {
                    path: '/nested-sibling',
                    component: () => 'Nested sibling'
                },
                {
                    path: '/nested',
                    component: ({ children }) => (

                        <div>
                            <div>Nested route</div>
                            <div>{children}</div>
                        </div>
                    ),
                    childRoutes: [
                        {
                            path: '/double',
                            component: ({ children }) => (

                                <div>
                                    <div>Double nested</div>
                                    <div>{children}</div>
                                </div>
                            ),
                            childRoutes: [
                                {
                                    path: '/triple',
                                    component: ({ children }) => (

                                        <div>
                                            <div>Triple nested</div>
                                            <div>{children}</div>
                                        </div>
                                    ),
                                    childRoutes: [
                                        {
                                            path: '/quadruple',
                                            component: ({ children }) => (

                                                <div>
                                                    <div>Quadruple nested</div>
                                                    <div>{children}</div>
                                                </div>
                                            ),
                                            childRoutes: [
                                                {
                                                    path: '/quintuple',
                                                    component: () => 'Quintuple nested'
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ];

    renderWithRouter(
        '/root/nested/double',
        <Routes routes={routes} />
    );

    expect(getByText('Root route')).toBeDefined();
    expect(() => getByText('Nested sibling')).toThrow();
    expect(getByText('Nested route')).toBeDefined();
    expect(getByText('Double nested')).toBeDefined();
    expect(() => getByText('Triple nested')).toThrow();
    expect(() => getByText('Quadruple nested')).toThrow();
    expect(() => getByText('Quintuple nested')).toThrow();

    renderWithRouter(
        '/root/nested/double/triple/quadruple/quintuple',
        <Routes routes={routes} />
    );

    expect(getByText('Root route')).toBeDefined();
    expect(() => getByText('Nested sibling')).toThrow();
    expect(getByText('Nested route')).toBeDefined();
    expect(getByText('Double nested')).toBeDefined();
    expect(getByText('Triple nested')).toBeDefined();
    expect(getByText('Quadruple nested')).toBeDefined();
    expect(getByText('Quintuple nested')).toBeDefined();
});
