/**
 * Created by jhelmuth on 7/23/16.
 */

import React from 'react';

import {Link} from 'react-router';

export default React.createClass({
    render() {
        return <Link {...this.props} activeClassName="active" />;
    }
});