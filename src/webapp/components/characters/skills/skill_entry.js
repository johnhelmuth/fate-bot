/**
 * Created by jhelmuth on 7/24/16.
 */

import React from 'react';
import fate_ladder from '../../../../libs/fate_ladder';
import DiceButton from '../dice/dice_button';
import './skills.less';

function formatKeyForDisplay(key) {
    console.log('formatKeyForDisplay() key: ', key);
    return key.trim().split(/[ _]/)
        .map((key_word) => {
            return key_word[0].toUpperCase() + key_word.slice(1)
        })
        .join(' ');
}

export default React.createClass({

    renderDiceButton() {
        if (this.props.character.is_owner) {
            return (
                <DiceButton className="roll-button" character={this.props.character} skill={this.props.skill}
                            rating={this.props.rating}/>
            );
        }
        return null;
    },

    render() {
        console.log('Skill_Entry this.props: ', this.props);
        var className = "skill-value " + "skill-rating-" + this.props.rating;
        return (
        <li className={className}>
            {formatKeyForDisplay(this.props.skill)}&nbsp;
            {this.renderDiceButton()}
        </li>);
    }
});