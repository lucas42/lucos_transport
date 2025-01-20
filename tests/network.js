import test from 'ava';
import Network from '../src/classes/network.js'

test('Create Network', test => {
	var network = new Network('id123');
	test.is(network.getCode(), 'id123');
	test.is(network.getCssClass(), 'network_id123');
});