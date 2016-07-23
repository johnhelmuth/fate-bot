/**
 * Created by jhelmuth on 7/10/16.
 */

import React from 'react';

import {IndexLink} from 'react-router'
import NavLink from './NavLink';

export default React.createClass({

    render() {
        return (
            <div>
                <h1>FateBot Status</h1>
                <ul role="nav">
                    <li><IndexLink to="/">Home</IndexLink></li>
                    <li><NavLink to="/about">About</NavLink></li>
                    <li><NavLink to="/servers">Servers</NavLink></li>
                </ul>
                {this.props.children}
            </div>
        );
    }

});
