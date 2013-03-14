class DLRStation < LineStation
	
	def force_update
		begin
			response = Net::HTTP.get_response(URI.parse('http://www.dlrlondon.co.uk/xml/mobile/'+@station+'.xml'))
			rescue Exception => e
			puts 'Error fetching ' + @station + ' station'
			return
		end
		
		@data = Document.new(response.body)
		if (@data.nil? or @data.elements["ttBoxset/[@id = 'ttbox']"].nil?)
			raise "Station Not Found"
		end
		@validtime = Time.parse(response['Date'])
		@expires = Time.now + 60
	end
	
	def get_info
		update
		info = {
			:stops => [],
			:platforms => {},
			:destinations => {},
			:expires => @expires,
			:lines => ['L'],
		}
		station = @data.elements['ttBoxset']
		if (station.nil?)
			return info
		end
		station.elements.each("div") { |platform|
			platformleft = platform.elements["*[@id = 'platformleft']/img"].attributes['src'][/\d+/]
			platformright = platform.elements["*[@id = 'platformright']/img"].attributes['src'][/\d+/]
			if (platformleft == platformright)
				platformName = "Platform " + platformleft
			else
				platformName = "Platforms " + platformleft + " & " + platformright
			end
			platformNum = platformleft.to_i
			info[:platforms][platformNum] = platformName
			
			if (false)
			platform.elements.each('T') { |stop|
				begin
					time = @validtime.to_i + stop.attributes['SecondsTo'].to_i
					pseudoline = @line
					if (!(stop.attributes['Destination'].index('Circle').nil?) and stop.attributes['Destination'] != 'Circle and Hammersmith & City')
						pseudoline = @network.get_line('I')
					end
					if (@line != pseudoline)
						pseudoline.add_station(@station, self)
					end
					@network.set_station(pseudoline, @station, self)
					info[:lines] << pseudoline.get_code
					
					info[:destinations][stop.attributes['DestCode'].to_i] = stop.attributes['Destination']
					info[:stops] << {
						:t => stop.attributes['SetNo'].to_i,	# Train number
						:d => stop.attributes['DestCode'].to_i,	# Destination number
						:r => stop.attributes['TripNo'].to_i,	# Route number
						:s => station.attributes['Code'],		# Station code
						:p => platformNum,						# Platform number
						:l => pseudoline.get_code,				# Line code
						:i => time,								# Departure time (unix timestamp)
					}
					rescue Exception => e
					puts e
					puts e.backtrace
				end
				
			}
			end
		}
		info
	end
end