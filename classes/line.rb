
include REXML

class Line
	def initialize (network, code, name)
		@code = code
		@name = name
		@stations = {}
		@network = network
		
		force_update
	end
	def force_update
		puts 'updating ' + @name + ' line'
		begin
			response = Net::HTTP.get_response(URI.parse('http://cloud.tfl.gov.uk/TrackerNet/PredictionSummary/'+@code))
		rescue Exception => e
			puts 'Error fetching ' + @name +' line'
			return
		end
		if (response.code != '200')
			raise "Error response ("+response.code+") for "+@name+" line"
		end
		begin
			data = Document.new(response.body)
		rescue ParseException => e
			puts 'Error parsing ' + @name +' line'
			return
		end
		if data.elements['ROOT/S'].nil?
			puts "Line (" + @code + ")Not Found"
			return
		end
		@validtime = Time.parse(data.elements['ROOT/Time'].attributes['TimeStamp'])
		@expires = Time.parse(response['Expires'])
		stations = {}
		info = {
			:stops => [],
			:stations => {},
			:destinations => {},
			:lines => { @code => @name },
			:expires => @expires,
		}
		begin
			data.elements.each("ROOT/S") { |stationData|
				stationcode = stationData.attributes['Code']
				if @stations[stationcode].nil?
					begin
						station = LineStation.new(@network, self, stationcode)
					rescue Exception => e
						puts "Can't find "+stationData.attributes['N']+"("+stationcode+")"
					end
				else
					station = @stations[stationcode]
					station.update
				end
				if (!station.nil?)
					stationinfo = station.get_info
					info[:stations][stationcode] = {
						:n => stationinfo[:name],
						:p => stationinfo[:platforms],
						:l => stationinfo[:lines].sort,
					}
					info[:stops].concat(stationinfo[:stops])
					info[:destinations].update(stationinfo[:destinations])
					stations[stationcode] = station
					if (!stationinfo[:expires].nil? and stationinfo[:expires] < info[:expires])
						info[:expires] = stationinfo[:expires]
					end
				else
					#Fallback to summary data
					info[:stations][stationcode] = {
						:n => stationData.attributes['N'].chop, #Chop the dot which follows the name,
						:p => {},
						:l => [],
					}
					stationData.elements.each('P') { |platform|
						platformNum = platform.attributes['Code'].to_i + 1 # Platforms in summary data are zero-indexed, but in detailed they're one-indexed
						info[:stations][stationcode][:p][platformNum] = platform.attributes["N"]
						platform.elements.each('T') { |stop|
							
							rawtime = stop.attributes['C']
							if (rawtime == '-')
								time = @validtime.to_i
							else
								rawtime = rawtime.split(':')
								time = @validtime.to_i + (rawtime[0].to_i * 60) + rawtime[1].to_i
							end
							
							if (info[:destinations][stop.attributes['D'].to_i].nil?)
								info[:destinations][stop.attributes['D'].to_i] = stop.attributes['DE']
							end
							pseudolinecode = @code
							if (!(stop.attributes['DE'].index('Circle').nil?) and stop.attributes['DE'] != 'Circle and Hammersmith & City')
								pseudolinecode = 'I';
							end
							info[:stations][stationcode][:l] << pseudolinecode
							info[:stops] << {
								:t => stop.attributes['S'].to_i,		# Train number
								:d => stop.attributes['D'].to_i,		# Destination number
								:r => stop.attributes['T'].to_i,		# Route number
								:s => stationcode,						# Station code
								:p => platformNum,						# Platform number
								:l => pseudolinecode,					# Line code
								:i => time,								# Departure time (unix timestamp)
							}
						}
					}
					
				end
				info[:stations][stationcode][:l] = info[:stations][stationcode][:l].sort.uniq
			}
			@stations = stations
			@info = info
			@network.update_info
		rescue Exception => e
			puts @name + " Line: " + e
			puts e.backtrace
		end
	end
	
	# only actually update if the current data has expired
	def update
		if (@expires.nil? or @expires < Time.now)
			force_update
		end
	end
	
	def get_info
		@info
	end
	def get_name
		@name
	end
	def get_code
		@code
	end
	def get_stations
		@stations
	end
end
