/**
 * Created by jhelmuth on 7/24/16.
 */

import React from 'react';
import axios from 'axios';
import DiceResult from './dice_result';
import _ from 'lodash';
import classnames from 'classnames';
import './dice.less';

export default React.createClass({

    getInitialState() {
        return {roll: {}};
    },

    getDefaultProps() {
        return {
            skill: "unknown",
            rating: 0,
            character: null
        };
    },

    rollClick() {
        console.log('clicked roll button.', this.props.skill, this.props.rating);
        if (this.props.character) {
            axios.get(`/api/server/${this.props.character.server_id}/character/${this.props.character.player_id}/${this.props.skill}/roll`)
                .then(roll_resp => {
                    if (roll_resp.statusText == "OK") {
                        console.log('DiceButton rollClick() roll_resp.data.roll: ', roll_resp.data.roll);
                        this.setState({ roll: roll_resp.data.roll});
                        console.log('roll_resp.data.roll: ', roll_resp.data.roll);
                    } else {
                        console.error('DiceButton rollClick() error: ', roll_resp);
                    }
                })
                .catch(err => {
                    console.error('/api/servers/:server_id/character/:player_id/:skill/roll', err.toString());
                });
        }
    },

    closeResult() {
        this.setState({ roll: null });
    },

    render() {
        console.log('DiceButton this.props: ', this.props);
        console.log('DiceButton this.state: ', this.state);
        var result_classes = classnames({
            'dice-result': true,
            'empty': _.isEmpty(this.state.roll)
        });
        // @TDOO this should probably not be a table nested inside of an LI nested inside of another table.
        return (
            <table className="dice-button">
                <tbody>
                <tr>
                    <td>
                        <button className={this.props.className} onClick={this.rollClick}>Roll</button>
                    </td>
                    <td className={result_classes}>
                        <DiceResult char_name={this.props.character.name}
                                    skill={this.props.skill}
                                    roll={this.state.roll}
                                    closeResult={this.closeResult}
                        />
                    </td>
                </tr>
                </tbody>
            </table>
        );
    }
});