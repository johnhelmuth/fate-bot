/**
 * Created by jhelmuth on 7/23/16.
 */

import React from 'react';
import _ from 'lodash';
import fate_ladder from '../../../libs/fate_ladder';
import SkillsList from './skills/skills_list';
import './characters.less';

function formatKeyForDisplay(key) {
    console.log('formatKeyForDisplay() key: ', key);
    return key.trim().split(/[ _]/)
        .map((key_word) => {
            return key_word[0].toUpperCase() + key_word.slice(1)
        })
        .join(' ');
}

export default React.createClass({

    renderAspects() {
        var character = this.props.character;
        var aspects = [];
        if (character.hasOwnProperty('aspects')) {
            aspects = _.concat([
                    <li key={this.makeKey("HC")} className="aspect"><label>HC</label> <span className="aspect-value">{character.aspects.HC}</span></li>,
                    <li key={this.makeKey("Trouble")} className="aspect"><label>Trouble</label> <span className="aspect-value">{character.aspects.Trouble}</span>
                    </li>
                ],
                _.map(character.aspects, (aspect, key) => {
                    if (['HC', 'Trouble'].indexOf(key) == -1) {
                        return <li key={this.makeKey(key)} className="aspect"><label>{key}</label> <span className="aspect-value">{aspect}</span></li>;
                    }

                }));
        }
        return aspects;
    },

    makeKey(key) {
        return `${this.props.character.player_id}:${key}`;
    },

    renderKeyValueEntry(key, entry, type_of_list) {
        return <li key={this.makeKey(key)} className={type_of_list}><label>{formatKeyForDisplay(key)}</label> <span
            className="value">{entry}</span></li>;
    },

    renderKeyValueList(list, type_of_list) {
        return _.map(list, (entry, key) => {return this.renderKeyValueEntry(key, entry, type_of_list);});
    },

    renderStunts() {
        return this.renderKeyValueList(this.props.character.stunts, 'stunt');
    },

    renderConsequences() {
        return this.renderKeyValueList(this.props.character.consequences, 'consequence');
    },

    render() {
        console.log('CharacterSheet this.props: ', this.props);
        var character = this.props.character;
        return (
            <ul>
                <li><label>Character</label> <span className="value">{character.name}</span></li>
                <li><label>Player</label> <span className="value">{character.player}</span></li>
                <li><label>Server</label> <span className="value">{character.server_name}</span></li>
                <li><label>Fate Points</label> <span className="value">{character.fate_points}</span></li>
                <li><label>Refresh</label> <span className="value">{character.refresh}</span></li>
                <li><label>Aspects</label>
                    <ul>
                        {this.renderAspects()}
                    </ul>
                </li>
                <li><label>Skills</label>
                    <SkillsList skills={this.props.character.skills} character={character}/>
                </li>
                <li><label>Stunts</label>
                    <ul>
                        {this.renderStunts()}
                    </ul>
                </li>
                <li><label>Consequences</label>
                    <ul>
                        {this.renderConsequences()}
                    </ul>
                </li>
            </ul>
        );
    }
});
