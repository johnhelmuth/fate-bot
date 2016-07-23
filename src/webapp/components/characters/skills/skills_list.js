/**
 * Created by jhelmuth on 7/24/16.
 */

import React from 'react';
import _ from 'lodash';
import fate_ladder from '../../../../libs/fate_ladder';
import SkillEntry from './skill_entry';
import './skills.less';

function formatKeyForDisplay(key) {
    console.log('formatKeyForDisplay() key: ', key);
    return key.trim().split(/[ _]/)
        .map((key_word) => {
            return key_word[0].toUpperCase() + key_word.slice(1)
        })
        .join(' ');
}

function formatRating(rating) {
    var str_rating = addSign(rating);
    if (fate_ladder.hasOwnProperty(rating)) {
        str_rating = fate_ladder[rating] + ` (${str_rating})`;
    }
    return str_rating;
}

function addSign(rating) {
    var num_rating = parseInt(rating);
    return (num_rating >= 0 ? '+' : '') + num_rating;
}

export default React.createClass({

    renderKeyValueEntry(key, entry, type_of_list) {
        return <tr key={key} className={type_of_list}><td>{formatKeyForDisplay(key)}</td><td
            className="value">{entry}</td></tr>;
    },

    renderSkillsEntry(rating, skills) {
        var skill_entries = skills.map((skill) => {
            return <SkillEntry key={skill} rating={rating} skill={skill} character={this.props.character}/>
        });
        console.log('renderSkillsEntry() skill_entries: ', skill_entries);
        return (
            <ul className="skill-list">
                {skill_entries}
            </ul>
        );
    },

    renderSkills() {
        var skills_by_rating = _.reduce(this.props.skills,
            (list, rating, skill) => {
                rating = 1 * rating;
                if (!list.hasOwnProperty(rating)) {
                    list[rating] = [];
                }
                list[rating].push(skill);
                return list;
            },
            {}
        );
        return Object.keys(skills_by_rating).sort((a, b) => {
            return (b - a);
        }).map((rating) => {
            console.log('renderSkills() rating: ', rating, ' skills_by_rating[rating]: ', skills_by_rating[rating]);
            return this.renderKeyValueEntry(
                formatRating(rating),
                this.renderSkillsEntry(rating, skills_by_rating[rating]),
                'skills'
            );
        });
    },


    render() {
        console.log('SkillsList this.props: ', this.props);
        return (
            <table>
                <tbody>
                    {this.renderSkills()}
                </tbody>
            </table>
        );
    }
});