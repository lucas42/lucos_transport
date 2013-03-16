class DLRStation < LineStation
	
	def force_update
		begin
			response = Net::HTTP.get_response(URI.parse('http://www.dlrlondon.co.uk/xml/mobile/'+@station+'.xml'))
			rescue Exception => e
			puts 'Error fetching ' + @station + ' station'
			return
		end
		if (response.code != '200')
			raise "Error response ("+response.code+") for DLR station "+@station
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
			platformleft = platform.elements["*[@id = 'platformleft']/img"].attributes['src'][/\d+[^lr]?/]
			platformright = platform.elements["*[@id = 'platformright']/img"].attributes['src'][/\d+[^lr]?/]
			if (platformleft == platformright)
				platformName = "Platform " + platformleft
				platformNum = platformleft
			else
				platformName = "Platforms " + platformleft + " & " + platformright
				platformNum = platformleft + " & " + platformright
			end
			info[:platforms][platformNum] = platformName
			
			
			platformtime = Time.parse(platform.elements["*[@id = 'platformmiddle']/div[@id = 'time']"].text)
			@validtime = platformtime
			
			firsttrain = platform.elements["*[@id = 'platformmiddle']/div[@id = 'line1']"].text
			firsttrain.strip!
			if (firsttrain != "")
				info[:stops] << get_stop(platformNum, platformtime, firsttrain)
			end
			
			followingtrains = platform.elements["*[@id = 'platformmiddle']/div[@id = 'line23']/p"].text
			followingtrains.strip!
			followingtrains.split(/\s*[\n\r]+\s*/).each() { |train|
				info[:stops] << get_stop(platformNum, platformtime, train)
			}
		}
		info[:stops].each() { |stop|
			info[:destinations][stop[:d]] = stop[:d]
		}
		info
	end
	
	private
	def get_stop(platformNum, time, datastr)
		data = datastr.match(/^(?:\d+\s*)?(.+?)(?:\s+(\d+)\s+mins?)?$/i)
		destination = data[1]
		if (data[2].nil?)
			secsto = 0
		else
			secsto = data[2].to_i * 60
		end
		timestamp = time.to_i + secsto
		
		# Make the destination title case for consistency (First trains are usually already title case, but following trains are uppercase)
		destination.gsub(/\b('?[a-z])/) { $1.capitalize }
		{
			:t => 0,			# Train number
			:d => destination,			# Destination number
			:r => nil,			# Route number
			:s => @station,		# Station code
			:p => platformNum,	# Platform number
			:l => 'L',			# Line code
			:i => timestamp,			# Departure time (unix timestamp)
		}
	end
end