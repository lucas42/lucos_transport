class DLRLine < Line
	def force_update
		puts 'updating ' + @name + ' line'
		begin
			response = Net::HTTP.get_response(URI.parse('http://www.dlrlondon.co.uk/mobile/Departures.aspx'))
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
		@expires = Time.now + 60
		@validtime = Time.parse(response['Date'])
		stations = {}
		info = {
			:stops => [],
			:stations => {},
			:destinations => {},
			:lines => { @code => @name },
			:expires => @expires,
		}
		data.elements.each("//*[@id = 'stationDepartures']/option") { |stationData|
			stationcode = stationData.attributes['value']
			stationname = stationData.text
			if (stationcode.empty?)
				next
			end
			if @stations[stationcode].nil?
				begin
					station = DLRStation.new(@network, self, stationcode)
					rescue Exception => e
					puts "Can't find "+stationname+"("+stationcode+")"
				end
				else
				station = @stations[stationcode]
				station.update
			end
			if (!station.nil?)
				stationinfo = station.get_info
				info[:stations][stationcode] = {
					:n => stationname,
					:p => stationinfo[:platforms],
					:l => stationinfo[:lines].sort,
				}
				info[:stops].concat(stationinfo[:stops])
				info[:destinations].update(stationinfo[:destinations])
				stations[stationcode] = station
				if (!stationinfo[:expires].nil? and stationinfo[:expires] < info[:expires])
					info[:expires] = stationinfo[:expires]
				end
			end
		}
		@stations = stations
		@info = info
		@network.update_info
	end
end