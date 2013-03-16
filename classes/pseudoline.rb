
include REXML

class PseudoLine < Line
	def initialize (network, code, name, routes)
		@routes = routes
		@stops = []
		super(network, code, name)
	end
	def force_update
		info = {
			:stops => @stops,
			:stations => {},
			:destinations => {},
			:lines => { @code => @name },
		}
		@stations.each_pair do |stationcode, station|
			stationinfo = station.get_info
			info[:stations][stationcode] = {
				:n => stationinfo[:name],
				:p => stationinfo[:platforms],
				:l => stationinfo[:lines].sort,
			}
		end
		@info = info
	end
	def add_station(code, station)
		@stations[code] = station
	end
end
