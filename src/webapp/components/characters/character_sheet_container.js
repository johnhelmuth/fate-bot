/**
 * Created by jhelmuth on 7/23/16.
 */

import React from 'react';

import axios from 'axios';
import CharacterSheet from './character_sheet';

export default React.createClass({

    getInitialState() {
        return {character: {}};
    },

    getCharacter() {
        axios.get('/api/server/' + this.props.params.server_id + '/character/' + this.props.params.player_id)
            .then(character_sheet => {
                if (character_sheet.statusText == "OK") {
                    console.log('character_sheet.data: ', character_sheet.data);
                    this.setState({character: character_sheet.data});
                } else {
                    console.error('CharacterSheetContainer getCharacter() error: ', server_data);
                }
            })
            .catch(err => {
                console.error('/api/servers/:server_id/character/:player_id', err.toString());
            });
    },

    componentDidMount() {
        this.getCharacter();
    },

    render() {
        return (
            <ul>
                <CharacterSheet character={this.state.character} {...this.props}/>
            </ul>
        );
    }

});