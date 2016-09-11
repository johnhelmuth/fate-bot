/**
 * Created by jhelmuth on 7/23/16.
 */
import React from 'react';

import axios from 'axios';
import GuildList from './guild_list';

export default React.createClass({

    getInitialState() {
        return {guilds: []};
    },

    getGuilds() {
        axios.get('/api/guilds')
            .then(guild_data => {
                if (guild_data.statusText == "OK") {
                    console.log('guild_data.data: ', guild_data.data);
                    this.setState(guild_data.data);
                } else {
                    console.error('App getGuilds() error: ', guild_data);
                }
            })
            .catch(err => {
                console.error('/api/guilds', err.toString());
            });
    },

    componentDidMount() {
        this.getGuilds();
    },

    render() {
        return (
            <div>
                <h2>Discord Guilds</h2>
                <GuildList guilds={this.state.guilds}/>
            </div>
        );
    }

});