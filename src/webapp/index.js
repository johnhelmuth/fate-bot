/**
 * Created by jhelmuth on 7/10/16.
 */

import React from 'react';
import { Router, Route, browserHistory, IndexRoute } from 'react-router';

import { render } from 'react-dom';
import App from './components/app';
import ServerListContainer from './components/servers/server_list_container';
import ServerEntryContainer from './components/servers/server_entry_container';
import CharacterSheetContainer from './components/characters/character_sheet_container';

import About from './components/about';
import './styles/app.less';

console.log('Loading webapp App component.');
render ((
    <Router history={browserHistory}>
        <Route path="/" component={App}>
            <IndexRoute component={ServerListContainer}/>
            <Route path="/about" component={About}/>
            <Route path="/servers" component={ServerListContainer}/>
            <Route path="/server/:server_id" component={ServerEntryContainer}/>
            <Route path="/server/:server_id/character/:player_id" component={CharacterSheetContainer}/>
        </Route>
    </Router>
),
    document.getElementById('main')
);
