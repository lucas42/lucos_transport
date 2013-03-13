
include REXML

class StationController < Mustache
	self.template_file = 'templates/station.html'
	def initialize (network, code)
		
		stations = network.get_station(code)
		if (stations.nil?)
			raise "Station Not Found"
		end
		
		self[:platforms] = []
		stations.each_pair do |line, station|
			self[:name] = station.get_info[:name]
			self[:platforms].concat(station.get_platforms)
		end
		self[:title] = self[:name]
		self[:link] = '/tube/'+code
		
	end
end
