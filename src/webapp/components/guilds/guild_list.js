import React from 'react';
import GuildEntry from './guild_entry';
// import _ from 'lodash';

export default React.createClass({
    render() {
        console.log('GuildList.render() this.props: ', this.props);
        if (this.props.guilds && this.props.guilds.length) {
            var guilds = this.props.guilds.map(
                guild => <GuildEntry key={guild.id} guild={guild} link="true"/>
            );
            return (<ul>{guilds}</ul>);
        }
        return (<p>No guilds found.</p>);
    }
});
