
include REXML

class Network
	
	def initialize (predictioncodes, pseudolines)
		@lines = []
		@info = {}
		@statuses = {}
		@stations = {}
		@updating = false
		pseudolines.each_pair do |code, name|
			@lines << PseudoLine.new(self, code, name, [])
		end
		predictioncodes.each_pair do |code, name|
			Thread.new {
				@lines << Line.new(self, code, name)
			}
		end
		Thread.new {
			@lines << DLRLine.new(self, 'L', 'DLR')
		}
		update
	end
	def force_update
		statuses = {}
		begin
			response = Net::HTTP.get_response(URI.parse('http://cloud.tfl.gov.uk/TrackerNet/LineStatus'))
		rescue Exception => e
			puts 'Error fetching Line Status'
			return
		end
		@expires = Time.parse(response['Expires'])
		status = Document.new(response.body)
		status.elements.each("ArrayOfLineStatus/LineStatus") { |linestatus|
			case linestatus.elements['Line'].attributes['Name']
				when 'Circle'
					symbol = 'I'
				when 'DLR'
					symbol = 'L'
				else
					symbol = linestatus.elements['Line'].attributes['Name'][0,1]
			end
			statuses[symbol] = {
				:status => linestatus.elements['Status'].attributes['Description'],
				:details => linestatus.attributes['StatusDetails'],
			}
		}
		@statuses = statuses
		update_info
	end
	def update_info
		info = {
			:stops => [],
			:stations => {},
			:destinations => {},
			:lines => {},
			:status => @statuses,
			:expires => @expires,
		}
		@lines.each() { |line|
			begin
				lineinfo = line.get_info
				if (lineinfo.nil? or lineinfo[:stops].nil?)
					# ignore lines which haven't initalised yet
					return
				end
				info[:stops].concat(lineinfo[:stops])
				info[:stations].update(lineinfo[:stations]) { |key, st1, st2|
					p1 = st1[:p]
					p2 = st2[:p]
					p1.update(p2)
					st1[:l] = st1[:l].concat(st2[:l]).sort.uniq
					st1
				}
				info[:destinations].update(lineinfo[:destinations])
				info[:lines].update(lineinfo[:lines])
				if (info[:expires].nil? or (!lineinfo[:expires].nil? and lineinfo[:expires] < info[:expires]))
					info[:expires] = lineinfo[:expires]
				end
			rescue Exception => e
				puts 'Error getting line info: ' + e 
				puts e.backtrace
			end
		}
		@info = info
	end
	def update
	
		# Only update once at a time
		if (@updating)
			return
		end
		@updating = true
		# only actually update if the current data has expired
		if (@expires.nil? or @expires < Time.new)
			force_update
		end
		@lines.each() { |line|
			line.update
		}
		@updating = false
	end
	def get_info
		Thread.new {
			update
		}
		@info
	end
	def get_line (id)
		@lines.each() { |line|
			if (line.get_name == id or line.get_code == id)
				return line
			end
		}
		raise "Line Not Found"
	end
	def get_lines
		@lines
	end
	def get_status (code)
		@statuses[code]
	end
	def set_station (line, stationcode, station)
		if (@stations[stationcode].nil?)
			@stations[stationcode] = {}
		end
		@stations[stationcode][line] = station
	end
	def get_station (stationcode)
		@stations[stationcode]
	end
end
