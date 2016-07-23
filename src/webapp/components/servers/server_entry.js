import React from 'react';
import { Link } from 'react-router';

import CharacterList from '../characters/character_list';

export default React.createClass({
    getDefaultProps() {
        return {is_expandable: true, server: {} };
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
        console.log('ServerEntry this.props: ', this.props);
        console.log('ServerEntry this.state: ', this.state);
        var link;
        if (this.props.link) {
            var to_href="/server/" + this.props.server.id;
            link = <Link to={to_href}>{this.props.server.name}</Link>;
        } else {
            link = <a onClick={this.handleClick}>{this.props.server.name}</a>
        }
        return (
            <li>
                {link}
                <CharacterList characters={this.props.server.characters} expanded={this.state.expanded}/>
            </li>
        );
    }
});
