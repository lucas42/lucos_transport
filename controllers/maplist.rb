class MapListController < Mustache
	self.template_file = 'templates/maplist.html'
	def initialize ()
		self[:maps] = [
			{
				'path' => 'becks-201112',
				'name' => 'Becks',
			},
			{
				'path' => 'CartoMetroLondon.v2.5',
				'name' => 'Carto Metro',
			},
			# {
			#	'path' => 'nationalrail-201212',
			#	'name' => 'National Rail',
			#},
		]
	end
end
