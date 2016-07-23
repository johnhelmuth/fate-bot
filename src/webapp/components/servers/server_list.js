import React from 'react';
import ServerEntry from './server_entry';
// import _ from 'lodash';

export default React.createClass({
    render() {
        console.log('ServerList.render() this.props: ', this.props);
        if (this.props.servers && this.props.servers.length) {
            var servers = this.props.servers.map(
                server => <ServerEntry key={server.id} server={server} link="true"/>
            );
            return (<ul>{servers}</ul>);
        }
        return (<p>No servers found.</p>);
    }
});
