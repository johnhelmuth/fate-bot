/**
 * Created by jhelmuth on 7/23/16.
 */
import React from 'react';

import axios from 'axios';
import ServerList from './server_list';

export default React.createClass({

    getInitialState() {
        return {servers: []};
    },

    getServers() {
        axios.get('/api/servers')
            .then(server_data => {
                if (server_data.statusText == "OK") {
                    console.log('server_data.data: ', server_data.data);
                    this.setState(server_data.data);
                } else {
                    console.error('App getServers() error: ', server_data);
                }
            })
            .catch(err => {
                console.error('/api/servers', err.toString());
            });
    },

    componentDidMount() {
        this.getServers();
    },

    render() {
        return (
            <div>
                <h2>Discord Servers</h2>
                <ServerList servers={this.state.servers}/>
            </div>
        );
    }

});