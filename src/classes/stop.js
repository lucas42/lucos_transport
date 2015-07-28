Thing = require('./thing');
function Stop() {
	Thing.apply(this, arguments);
}
Thing.extend(Stop);
module.exports = Stop;