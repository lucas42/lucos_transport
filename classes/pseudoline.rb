
include REXML

class PseudoLine < Line
	def initialize (network, code, name, routes)
		@routes = routes
		@stops = []
		super(network, code, name)
	end
	def force_update
		@info = {
			:stops => @stops,
			:stations => @stations,
			:destinations => {},
			:lines => { @code => @name },
		}
	end
	def add_station(code, station)
		@stations[code] = station
	end
end
