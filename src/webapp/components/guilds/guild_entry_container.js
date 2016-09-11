/**
 * Created by jhelmuth on 7/23/16.
 */

import React from 'react';

import axios from 'axios';
import GuildEntry from './guild_entry';

export default React.createClass({

    getInitialState() {
        return {guild: {}};
    },

    getGuild() {
        axios.get('/api/guild/' + this.props.params.guild_id)
            .then(guild_data => {
                if (guild_data.statusText == "OK") {
                    console.log('guild_data.data: ', guild_data.data);
                    this.setState({ guild: guild_data.data});
                } else {
                    console.error('App getGuild() error: ', guild_data);
                }
            })
            .catch(err => {
                console.error('/api/guild', err.toString());
            });
    },

    componentDidMount() {
        this.getGuild();
    },

    render() {
        return (
            <ul>
                <GuildEntry guild={this.state.guild} {...this.props} is_expandable="0"/>
            </ul>
        );
    }

});