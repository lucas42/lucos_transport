import test from 'ava';
import Network from '../src/classes/network.js'
import Route from '../src/classes/route.js'

test('Serialised Network', test => {
	var network1 = new Network('net1');
	network1.setField('fieldname', 'fieldval');
	new Route(network1, 'route1');
	new Route(network1, 'route2');
	var network2 = new Network('net2');
	new Route(network2, 'route3');
	test.deepEqual(Network.getAllSerialised(), {
		'net1': {
			'classID': 'Network-net1',
			'classType': 'Network',
			'fieldname': 'fieldval',
			'relations': {
				'route': [
					[['net1'], 'route1'],
					[['net1'], 'route2']
				],
			}
		},
		'net2': {
			'classID': 'Network-net2',
			'classType': 'Network',
			'relations': {
				'route': [
					[['net2'], 'route3']
				],
			}
		}
	});
});