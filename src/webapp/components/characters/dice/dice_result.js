/**
 * Created by jhelmuth on 7/24/16.
 */

import React from 'react';
import _ from 'lodash';
import DiceFormatter from '../../../../libs/diceroller/formatter';
import fate_ladder from '../../../../libs/fate_ladder';


export default React.createClass({

    // formatFudge(this.rolls, this.sum, this.parsed.bonus, this.parsed.description || '')
    render() {
        console.log('DiceResult: this.props: ', this.props);
        if (_.isEmpty(this.props.roll)) {
            return null;
        }
        var roll = this.props.roll;
        DiceFormatter.setFudgeMap(['-', '0', '+']);
        var dicefaces = DiceFormatter.formatRolls(roll);
        var bonus = DiceFormatter.formatBonus(roll.parsed.bonus);
        var sum = DiceFormatter.formatSum(roll);
        var descript = roll.parsed.description || '';
        return (
            <span onClick={this.props.closeResult}>
                <span className="dice-fate">{dicefaces}</span>
                <span className="dice-bonus">{bonus}</span> =
                <span className="dice-sum">{sum}</span>&nbsp;
                <span className="dice-description">{descript}</span>
                <span className="close-widget"></span>
            </span>
        );
    }
});