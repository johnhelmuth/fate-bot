/**
 * Created by jhelmuth on 7/7/16.
 */

var avatarImages = require('./avatar_images');

var dice_images;

/**
 * Load avatar dice images
 *
 * @param {Function} cfg - the function used to get configuration information
 */
function config(cfg) {
    var dice_images = cfg('dice_images');
    if (dice_images) {
        avatarImages
            .loadAllFromPath(dice_images.path)
            .catch(function (err) {
                console.log('Error loading avatar images from directory ' + dice_images.path, err);
            });
    }
}

module.exports = {
    avatarImages: avatarImages,
    config: config
};