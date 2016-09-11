/**
 * Created by jhelmuth on 7/19/16.
 */

import React from 'react';
import { Link } from 'react-router';

export default React.createClass({

    render() {
        console.log('CharacterEntry this.props: ', this.props);
        var href_to="/guild/" + this.props.character.guild_id + "/character/" + this.props.character.player_id;
        return (
            <li><Link to={href_to}>{this.props.character.name}</Link></li>
        );
    }
});
