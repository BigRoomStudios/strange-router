'use strict';

require('regenerator-runtime/runtime');

const React = require('react');
const { Router } = require('react-router-dom');
const { createBrowserHistory } = require('history');
const Testing = require('@testing-library/react');
const { Routes } = require('.');

const {
    screen,
    render
} = Testing;

const {
    // debug
} = screen;

const withRouter = (history, ui) => {

    // duck type history
    if (!history || !(history.push && history.replace && history.back && history.forward)) {
        throw new Error('Must pass valid history');
    }

    if (!ui || !React.isValidElement(ui)) {
        throw new Error('Must pass valid ui element');
    }

    return render(
        ui,
        { wrapper: (props) => <Router {...props} history={history} /> }
    );
};

it('renders without crashing with empty routes', () => {

    const history = createBrowserHistory();

    withRouter(history, <Routes routes={[]} />);
});

it('renders a simple route', () => {

    const history = createBrowserHistory();

    history.push('/');

    const { getByText } = withRouter(
        history,
        <Routes routes={{
            path: '/',
            component: () => 'Root route'
        }} />
    );

    expect(getByText('Root route')).toBeDefined();
});
