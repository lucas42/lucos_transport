const test = require('ava');
const Announcements = require("../src/announcements");
const Pubsub = require("lucos_pubsub");

test('Easter Homepage Announcement', test => {
	var routeData = [{"status":"Good Service","name":"Bakerloo","network":"tube"},{"status":"Good Service","name":"Central","network":"tube"},{"status":"Part Closure","name":"Circle","network":"tube"},{"status":"Part Closure","name":"District","network":"tube"},{"status":"Part Closure","name":"Hammersmith & City","network":"tube"},{"status":"Good Service","name":"Jubilee","network":"tube"},{"status":"Part Closure","name":"Metropolitan","network":"tube"},{"status":"Good Service","name":"Northern","network":"tube"},{"status":"Good Service","name":"Piccadilly","network":"tube"},{"status":"Good Service","name":"Victoria","network":"tube"},{"status":"Good Service","name":"Waterloo & City","network":"tube"},{"status":"Part Closure","name":"DLR","network":"dlr"},{"status":"Part Closure","name":"London Overground","network":"overground"},{"status":"Good Service","name":"RB1","network":"river-bus"},{"status":"Good Service","name":"RB1X","network":"river-bus"},{"status":"Good Service","name":"RB2","network":"river-bus"},{"status":"Good Service","name":"RB4","network":"river-bus"},{"status":"Good Service","name":"RB5","network":"river-bus"},{"status":"Good Service","name":"RB6","network":"river-bus"},{"status":"Minor Delays","name":"TfL Rail","network":"elizabeth-line"},{"status":"Part Closure","name":"Tram","network":"tram"},{"status":"Good Service","name":"Woolwich Ferry","network":"river-bus"},{"name":"bus","network":"bus"},{"name":"national-rail","network":"national-rail"}];
	Announcements('RouteList', {routes: routeData}, text => {
		test.is(text, "There is a Part Closure on the Circle, District, Hammersmith & City and Metropolitan Lines.  There is also a Part Closure on the DLR, London Overground and London Trams.  There are Minor Delays on TfL Rail.  There is a Good Service on other London Underground Lines and all River Bus Services.");
	});
});
test('Good Service Homepage Announcement', test => {
	var routeData = [{"status":"Good Service","name":"Bakerloo","network":"tube"},{"status":"Good Service","name":"Central","network":"tube"},{"status":"Good Service","name":"Circle","network":"tube"},{"status":"Good Service","name":"District","network":"tube"},{"status":"Good Service","name":"Hammersmith & City","network":"tube"},{"status":"Good Service","name":"Jubilee","network":"tube"},{"status":"Good Service","name":"Metropolitan","network":"tube"},{"status":"Good Service","name":"Northern","network":"tube"},{"status":"Good Service","name":"Piccadilly","network":"tube"},{"status":"Good Service","name":"Victoria","network":"tube"},{"status":"Good Service","name":"Waterloo & City","network":"tube"},{"status":"Good Service","name":"DLR","network":"dlr"},{"status":"Good Service","name":"London Overground","network":"overground"},{"status":"Good Service","name":"RB1","network":"river-bus"},{"status":"Good Service","name":"RB1X","network":"river-bus"},{"status":"Good Service","name":"RB2","network":"river-bus"},{"status":"Good Service","name":"RB4","network":"river-bus"},{"status":"Good Service","name":"RB5","network":"river-bus"},{"status":"Good Service","name":"RB6","network":"river-bus"},{"status":"Good Service","name":"TfL Rail","network":"elizabeth-line"},{"status":"Good Service","name":"Tram","network":"tram"},{"status":"Good Service","name":"Woolwich Ferry","network":"river-bus"},{"name":"bus","network":"bus"},{"name":"national-rail","network":"national-rail"}];
	Announcements('RouteList', {routes: routeData}, text => {
		test.is(text, "There is a Good Service on all London Underground Lines, the DLR, London Overground, all River Bus Services, TfL Rail and London Trams.");
	});
});
test('Blank Data Announcement', test => {
	var routeData = [{"name":"dlr","network":"dlr"},{"name":"bus","network":"bus"},{"name":"national-rail","network":"national-rail"},{"name":"rb1","network":"river-bus"},{"name":"rb1x","network":"river-bus"},{"name":"rb2","network":"river-bus"},{"name":"rb4","network":"river-bus"},{"name":"rb5","network":"river-bus"},{"name":"rb6","network":"river-bus"}];
		Announcements('RouteList', {routes: routeData}, text => {
		test.is(text, "Unable to Retrieve Status Updates");
	});
});
test('Night Tube Announcement', test => {
	var routeData = [{"status":"Service Closed","name":"Bakerloo","network":"tube"},{"status":"Good Service","name":"Central","network":"tube"},{"status":"Part Closure","name":"Circle","network":"tube"},{"status":"Part Closure","name":"District","network":"tube"},{"status":"Part Closure","name":"Hammersmith & City","network":"tube"},{"status":"Good Service","name":"Jubilee","network":"tube"},{"status":"Part Closure","name":"Metropolitan","network":"tube"},{"status":"Good Service","name":"Northern","network":"tube"},{"status":"Good Service","name":"Piccadilly","network":"tube"},{"status":"Severe Delays","name":"Victoria","network":"tube"},{"status":"Service Closed","name":"Waterloo & City","network":"tube"},{"status":"Part Closure","name":"DLR","network":"dlr"},{"status":"Part Closure","name":"London Overground","network":"overground"},{"status":"Good Service","name":"RB1","network":"river-bus"},{"status":"Good Service","name":"RB1X","network":"river-bus"},{"status":"Good Service","name":"RB2","network":"river-bus"},{"status":"Good Service","name":"RB4","network":"river-bus"},{"status":"Good Service","name":"RB5","network":"river-bus"},{"status":"Good Service","name":"RB6","network":"river-bus"},{"status":"Severe Delays","name":"TfL Rail","network":"elizabeth-line"},{"status":"Part Closure","name":"Tram","network":"tram"},{"status":"Good Service","name":"Woolwich Ferry","network":"river-bus"},{"name":"bus","network":"bus"},{"name":"national-rail","network":"national-rail"}];
	Announcements('RouteList', {routes: routeData}, text => {
		test.is(text, "The Baykerloo and Waterloo & City Lines are closed.  There is a Part Closure on the Circle, District, Hammersmith & City and Metropolitan Lines.  There is also a Part Closure on the DLR, London Overground and London Trams.  There are Severe Delays on the Victoria Line and TfL Rail.  There is a Good Service on other London Underground Lines and all River Bus Services.");
	});
});
test('All Closed Homepage Announcement', test => {
	var routeData = [{"status":"Service Closed","name":"Bakerloo","network":"tube"},{"status":"Service Closed","name":"Central","network":"tube"},{"status":"Service Closed","name":"Circle","network":"tube"},{"status":"Service Closed","name":"District","network":"tube"},{"status":"Service Closed","name":"Hammersmith & City","network":"tube"},{"status":"Service Closed","name":"Jubilee","network":"tube"},{"status":"Service Closed","name":"Metropolitan","network":"tube"},{"status":"Service Closed","name":"Northern","network":"tube"},{"status":"Service Closed","name":"Piccadilly","network":"tube"},{"status":"Service Closed","name":"Victoria","network":"tube"},{"status":"Service Closed","name":"Waterloo & City","network":"tube"},{"status":"Service Closed","name":"DLR","network":"dlr"},{"status":"Service Closed","name":"London Overground","network":"overground"},{"status":"Service Closed","name":"RB1","network":"river-bus"},{"status":"Service Closed","name":"RB1X","network":"river-bus"},{"status":"Service Closed","name":"RB2","network":"river-bus"},{"status":"Service Closed","name":"RB4","network":"river-bus"},{"status":"Service Closed","name":"RB5","network":"river-bus"},{"status":"Service Closed","name":"RB6","network":"river-bus"},{"status":"Service Closed","name":"TfL Rail","network":"elizabeth-line"},{"status":"Service Closed","name":"Tram","network":"tram"},{"status":"Service Closed","name":"Woolwich Ferry","network":"river-bus"},{"name":"bus","network":"bus"},{"name":"national-rail","network":"national-rail"}];
	Announcements('RouteList', {routes: routeData}, text => {
		test.is(text, "All London Underground Lines, the DLR, London Overground, all River Bus Services, TfL Rail and London Trams are closed.");
	});
});
test('Planned Closure and Service Closed Announcement', test => {
	var routeData = [{"status":"Good Service","name":"Bakerloo","network":"tube"},{"status":"Good Service","name":"Central","network":"tube"},{"status":"Part Closure","name":"Circle","network":"tube"},{"status":"Part Closure","name":"District","network":"tube"},{"status":"Part Closure","name":"Hammersmith & City","network":"tube"},{"status":"Good Service","name":"Jubilee","network":"tube"},{"status":"Part Closure","name":"Metropolitan","network":"tube"},{"status":"Good Service","name":"Northern","network":"tube"},{"status":"Good Service","name":"Piccadilly","network":"tube"},{"status":"Planned Closure","name":"Victoria","network":"tube"},{"status":"Service Closed","name":"Waterloo & City","network":"tube"},{"status":"Part Closure","name":"DLR","network":"dlr"},{"status":"Part Closure","name":"London Overground","network":"overground"},{"status":"Good Service","name":"RB1","network":"river-bus"},{"status":"Good Service","name":"RB1X","network":"river-bus"},{"status":"Good Service","name":"RB2","network":"river-bus"},{"status":"Good Service","name":"RB4","network":"river-bus"},{"status":"Good Service","name":"RB5","network":"river-bus"},{"status":"Good Service","name":"RB6","network":"river-bus"},{"status":"Planned Closure","name":"TfL Rail","network":"elizabeth-line"},{"status":"Part Closure","name":"Tram","network":"tram"},{"status":"Good Service","name":"Woolwich Ferry","network":"river-bus"},{"name":"bus","network":"bus"},{"name":"national-rail","network":"national-rail"}];
	Announcements('RouteList', {routes: routeData}, text => {
		test.is(text, "There is a Part Closure on the Circle, District, Hammersmith & City and Metropolitan Lines.  There is also a Part Closure on the DLR, London Overground and London Trams.  The Victoria Line, Waterloo & City Line and TfL Rail are closed.  There is a Good Service on other London Underground Lines and all River Bus Services.");
	});
});
test('Part Suspended Announcement', test => {
	var routeData = [{"status":"Good Service","name":"Bakerloo","network":"tube"},{"status":"Good Service","name":"Central","network":"tube"},{"status":"Part Closure","name":"Circle","network":"tube"},{"status":"Good Service","name":"District","network":"tube"},{"status":"Part Closure","name":"Hammersmith & City","network":"tube"},{"status":"Good Service","name":"Jubilee","network":"tube"},{"status":"Good Service","name":"Metropolitan","network":"tube"},{"status":"Good Service","name":"Northern","network":"tube"},{"status":"Good Service","name":"Piccadilly","network":"tube"},{"status":"Good Service","name":"Victoria","network":"tube"},{"status":"Good Service","name":"Waterloo & City","network":"tube"},{"status":"Part Suspended","name":"DLR","network":"dlr"},{"status":"Part Suspended","name":"London Overground","network":"overground"},{"status":"Good Service","name":"RB1","network":"river-bus"},{"status":"Good Service","name":"RB1X","network":"river-bus"},{"status":"Good Service","name":"RB2","network":"river-bus"},{"status":"Good Service","name":"RB4","network":"river-bus"},{"status":"Good Service","name":"RB5","network":"river-bus"},{"status":"Good Service","name":"RB6","network":"river-bus"},{"status":"Part Closure","name":"TfL Rail","network":"elizabeth-line"},{"status":"Good Service","name":"Tram","network":"tram"},{"status":"Good Service","name":"Woolwich Ferry","network":"river-bus"},{"name":"bus","network":"bus"},{"name":"national-rail","network":"national-rail"}];
	Announcements('RouteList', {routes: routeData}, text => {
		test.is(text, "There is a Part Closure on the Circle Line, Hammersmith & City Line and TfL Rail.  The DLR and London Overground are Part Suspended.  There is a Good Service on other London Underground Lines, all River Bus Services and London Trams.");
	});
});
test('Refresh Announcement', test => {
	Announcements(null, null, text => {
		test.is(text, "Updated.");
	});
	Pubsub.send('refreshComplete');
});
test('Train - approaching station Announcement', test => {
	Announcements("Vehicle", null, text => {
		test.is(text, "The next stop is Uxbridge");
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
	Announcements("Stop", null, text => {
		test.is(text, "The boat at Pier C is an RB1X service to North Greenwich");
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
	Announcements("Stop", null, text => {
		test.is(text, "The next train at Platform 9¾ will be a Baykerloo Line service to Hogsmeade");
	});
	Pubsub.send('eventApproaching', {
		vehicle: {
			classID: 'id246',
			vehicleType: 'train',
			routeName: 'Bakerloo Line',
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

test('Pier platform no name - boat arrived Announcement', test => {
	Announcements("Stop", null, text => {
		test.is(text, "This is an RB2 boat to Bankside");
	});
	Pubsub.send('eventArrived', {
		vehicle: {
			vehicleType: 'boat',
			classID: 'id123',
			routeName: 'RB2',
			simpleDestination: "Bankside",
		},
		stop: {
			classID: 'id987',
			simpleName: 'Embankment',
		},
		platform: {
			simpleName: "",
		}
	});
});

test('Pier platform no name - boat approaching Announcement', test => {
	Announcements("Stop", null, text => {
		test.is(text, "The next boat will be an RB5 service to Woolwich");
	});
	Pubsub.send('eventApproaching', {
		vehicle: {
			vehicleType: 'boat',
			classID: 'id123',
			routeName: 'RB5',
			simpleDestination: "Woolwich",
		},
		stop: {
			classID: 'id987',
			simpleName: 'North Greenwich',
		},
		platform: {
			simpleName: "",
		}
	});
});

// TODO: interchanges to other lines/modes

// TODO: "Alight here" for landmarks