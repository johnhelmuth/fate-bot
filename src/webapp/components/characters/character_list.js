/**
 * Created by jhelmuth on 7/19/16.
 */

import React from 'react';
import classnames from 'classnames';

import CharacterEntry from './character_entry';


export default React.createClass({

    makeKey(character) {
        return `${character.server_id}:${character.id}`;
    },

    render() {
        console.log('CharacterList.render() this.props: ', this.props);
        var className = classnames({ 'collapsed-list': (!this.props.expanded)});
        if (this.props.characters && this.props.characters.length) {
            var characters = this.props.characters.map(
                character => <CharacterEntry key={this.makeKey(character)} character={character}/>
            );
            return (<ul className={className}>{characters}</ul>);
        } else {
            return (<ul className={className}>
                <li>No characters.</li>
            </ul>);
        }
    }
});
