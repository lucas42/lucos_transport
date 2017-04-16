import test from 'ava';
const Announcements = require("../src/announcements");
const Pubsub = require("lucos_pubsub");

test('Easter Homepage Announcement', test => {
	var routeData = [{"status":"Good Service","name":"Bakerloo","network":"tube"},{"status":"Good Service","name":"Central","network":"tube"},{"status":"Part Closure","name":"Circle","network":"tube"},{"status":"Part Closure","name":"District","network":"tube"},{"status":"Part Closure","name":"Hammersmith & City","network":"tube"},{"status":"Good Service","name":"Jubilee","network":"tube"},{"status":"Part Closure","name":"Metropolitan","network":"tube"},{"status":"Good Service","name":"Northern","network":"tube"},{"status":"Good Service","name":"Piccadilly","network":"tube"},{"status":"Good Service","name":"Victoria","network":"tube"},{"status":"Good Service","name":"Waterloo & City","network":"tube"},{"status":"Part Closure","name":"DLR","network":"dlr"},{"status":"Part Closure","name":"London Overground","network":"overground"},{"status":"Good Service","name":"RB1","network":"river-bus"},{"status":"Good Service","name":"RB1X","network":"river-bus"},{"status":"Good Service","name":"RB2","network":"river-bus"},{"status":"Good Service","name":"RB4","network":"river-bus"},{"status":"Good Service","name":"RB5","network":"river-bus"},{"status":"Good Service","name":"RB6","network":"river-bus"},{"status":"Planned Closure","name":"TfL Rail","network":"tflrail"},{"status":"Part Closure","name":"Tram","network":"tram"},{"status":"Good Service","name":"Woolwich Ferry","network":"river-bus"},{"name":"bus","network":"bus"},{"name":"national-rail","network":"national-rail"}];
	Announcements('RouteList', null, {routes: routeData}, text => {
		test.is(text, "There is a Part Closure on the Circle, District, Hammersmith & City and Metropolitan Lines.  There is also a Part Closure on the DLR, the London Overground and Tram.  There is a Planned Closure on TfL Rail.  There is a Good Service on other London Underground Lines and all River Bus Services.");
	});
});
test('Good Service Homepage Announcement', test => {
	var routeData = [{"status":"Good Service","name":"Bakerloo","network":"tube"},{"status":"Good Service","name":"Central","network":"tube"},{"status":"Good Service","name":"Circle","network":"tube"},{"status":"Good Service","name":"District","network":"tube"},{"status":"Good Service","name":"Hammersmith & City","network":"tube"},{"status":"Good Service","name":"Jubilee","network":"tube"},{"status":"Good Service","name":"Metropolitan","network":"tube"},{"status":"Good Service","name":"Northern","network":"tube"},{"status":"Good Service","name":"Piccadilly","network":"tube"},{"status":"Good Service","name":"Victoria","network":"tube"},{"status":"Good Service","name":"Waterloo & City","network":"tube"},{"status":"Good Service","name":"DLR","network":"dlr"},{"status":"Good Service","name":"London Overground","network":"overground"},{"status":"Good Service","name":"RB1","network":"river-bus"},{"status":"Good Service","name":"RB1X","network":"river-bus"},{"status":"Good Service","name":"RB2","network":"river-bus"},{"status":"Good Service","name":"RB4","network":"river-bus"},{"status":"Good Service","name":"RB5","network":"river-bus"},{"status":"Good Service","name":"RB6","network":"river-bus"},{"status":"Good Service","name":"TfL Rail","network":"tflrail"},{"status":"Good Service","name":"Tram","network":"tram"},{"status":"Good Service","name":"Woolwich Ferry","network":"river-bus"},{"name":"bus","network":"bus"},{"name":"national-rail","network":"national-rail"}];
	Announcements('RouteList', null, {routes: routeData}, text => {
		test.is(text, "There is a Good Service on all London Underground Lines, the DLR, London Overground, all River Bus Services, TfL Rail and London Trams.");
	});
});
test('Blank Data Announcement', test => {
	var routeData = [{"name":"dlr","network":"dlr"},{"name":"bus","network":"bus"},{"name":"national-rail","network":"national-rail"},{"name":"rb1","network":"river-bus"},{"name":"rb1x","network":"river-bus"},{"name":"rb2","network":"river-bus"},{"name":"rb4","network":"river-bus"},{"name":"rb5","network":"river-bus"},{"name":"rb6","network":"river-bus"}];
		Announcements('RouteList', null, {routes: routeData}, text => {
		test.is(text, "Unable to Retrieve Status Updates");
	});
});
test('Refresh Announcement', test => {
	Announcements(null, null, null, text => {
		test.is(text, "Updated.");
	});
	Pubsub.send('refreshComplete');
});
test('Train - approaching station Announcement', test => {
	Announcements("Vehicle", 'id123', null, text => {
		test.is(text, "The next stop is Uxbridge");
	});
	Pubsub.send('eventApproaching', {
		vehicle: {
			classID: 'id246',
		},
		stop: {
			simpleName: 'Upminster'
		}
	});
	Pubsub.send('eventApproaching', {
		vehicle: {
			classID: 'id123',
		},
		stop: {
			simpleName: 'Uxbridge'
		}
	});
});
test('Pier - boat arrived Announcement', test => {
	Announcements("Stop", 'id987', null, text => {
		test.is(text, "The boat at Pier C is an RB1X boat to North Greenwich");
	});
	Pubsub.send('eventArrived', {
		vehicle: {
			classID: 'id246',
			vehicleType: 'hovercraft',
			routeName: 'HC3',
			simpleDestination: "Hogwarts",
			},
		stop: {
			classID: 'id234',
			simpleName: 'Upminster',
		},
		platform: {
			simpleName: "Platform 9 and three quarters",
		}
	});
	Pubsub.send('eventArrived', {
		vehicle: {
			vehicleType: 'boat',
			classID: 'id123',
			routeName: 'RB1X',
			simpleDestination: "North Greenwich",
		},
		stop: {
			classID: 'id987',
			simpleName: 'Uxbridge',
		},
		platform: {
			simpleName: "Pier C",
		}
	});
});
test('Platform - train approaching Announcement', test => {
	Announcements("Stop", 'id846', null, text => {
		test.is(text, "The next train at Platform 9¾ will be a District Line train to Hogsmeade");
	});
	Pubsub.send('eventApproaching', {
		vehicle: {
			classID: 'id246',
			vehicleType: 'train',
			routeName: 'District Line',
			simpleDestination: "Hogsmeade",
			},
		stop: {
			classID: 'id846',
			simpleName: 'Upminster',
		},
		platform: {
			simpleName: "Platform 9¾",
		}
	});
});