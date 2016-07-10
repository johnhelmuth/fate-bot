/**
 * Created by jhelmuth on 7/6/16.
 */

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');


var template_doc = fs.readFileAsync(path.join(__dirname, "../../images/4df.template.svg"), "utf-8");

var diceVals = ["-", "0", "+"];

diceVals.forEach(function (d0) {
	diceVals.forEach(function (d1) {
		diceVals.forEach(function (d2) {
			diceVals.forEach(function (d3) {
				var fileName = path.join(__dirname, "../../images/dice/" + d0 + d1 + d2 + d3 + '.svg');
				template_doc.then(function(doc) {
					var newdoc = doc
						.replace("--FD0--", d0)
						.replace("--FD1--", d1)
						.replace("--FD2--", d2)
						.replace("--FD3--", d3);
					console.log('Saving ' + fileName);
					return fs.writeFileAsync(fileName, newdoc)
						.then(function () {
							console.log(fileName + ' successfully written.');
						});
				});
			});
		});
	});
});

// to generate png files:
// mkdir -p src/images/dice/svg/4df
// cd src/images/dice/svg/4df
// for i in 4df.[-+0]*.svg ; do echo $i ; convert $i -quality 10 ../../4df/`basename $i .svg | sed 's/4df\.//g'`.jpg; done
// ends up with images in src/images/dice/4df/XXXX.jpg