/**
 * Created by jhelmuth on 7/23/16.
 */

import React from 'react';

import axios from 'axios';
import ServerEntry from './server_entry';

export default React.createClass({

    getInitialState() {
        return {server: {}};
    },

    getServers() {
        axios.get('/api/server/' + this.props.params.server_id)
            .then(server_data => {
                if (server_data.statusText == "OK") {
                    console.log('server_data.data: ', server_data.data);
                    this.setState({ server: server_data.data});
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
            <ul>
                <ServerEntry server={this.state.server} {...this.props} is_expandable="0"/>
            </ul>
        );
    }

});