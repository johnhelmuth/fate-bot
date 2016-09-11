import React from 'react';
import { Link } from 'react-router';

import CharacterList from '../characters/character_list';

export default React.createClass({
    getDefaultProps() {
        return {is_expandable: true, guild: {} };
    },

    getInitialState() {
        return {expanded: true};
    },

    handleClick() {
        if (this.props.is_expandable) {
            this.setState({expanded: (!this.state.expanded)});
        }
    },

    render() {
        console.log('GuildEntry this.props: ', this.props);
        console.log('GuildEntry this.state: ', this.state);
        var link;
        if (this.props.link) {
            var to_href="/guild/" + this.props.guild.id;
            link = <Link to={to_href}>{this.props.guild.name}</Link>;
        } else {
            link = <a onClick={this.handleClick}>{this.props.guild.name}</a>
        }
        return (
            <li>
                {link}
                <CharacterList characters={this.props.guild.characters} expanded={this.state.expanded}/>
            </li>
        );
    }
});
