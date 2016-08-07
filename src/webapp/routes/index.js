/**
 * Created by jhelmuth on 7/16/16.
 */

var auth = require("../auth");
var path = require('path');
var api_routes = require('./api');

module.exports = function(app) {
    const indexPath = path.join(__dirname, '../../../public/index.html');

    // handle /api/* routes
    api_routes(app);

    // handle all other routes of the webapp by having ReactRouter handle them
    // this is the final, fallback handler for those "virtual" routes,
    // like /server/ etc.
    app.get('*', auth.checkAuth.bind(auth),
        function (req, res) {
            console.log('/ serving index.html');// dump the user for debugging
            if (req.isAuthenticated()) {
                console.log('/ user: ', req.user);
            }
            res.sendFile(indexPath);
        });
};
