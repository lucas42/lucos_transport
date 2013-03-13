
include REXML

# NB: There can be multiple of these objects for interchange stations
class LineStation
	def initialize (network, line, stationcode)
		@line = line
		@station = stationcode
		@network = network
		force_update
	end
	def force_update
		begin
			response = Net::HTTP.get_response(URI.parse('http://cloud.tfl.gov.uk/TrackerNet/PredictionDetailed/'+@line.get_code+'/'+@station))
		rescue Exception => e
			puts 'Error fetching ' + @station + ' station'
			return
		end
		
			@data = Document.new(response.body)
			if (@data.nil? or @data.elements['ROOT/S'].nil?)
				raise "Station Not Found"
			end
			@validtime = Time.parse(@data.elements['ROOT/S'].attributes['CurTime'])
			@expires = Time.parse(response['Expires'])
	end
	
	# only actually update if the current data has expired
	def update
		if (@expires.nil? or @expires < Time.new)
			force_update
		end
	end
	
	def get_info
		update
		info = {
			:stops => [],
			:platforms => {},
			:destinations => {},
			:expires => @expires,
			:lines => [],
		}
		station = @data.elements['ROOT/S']
		if (station.nil?)
			return info
		end
		stationname = station.attributes['N'].chop #Chop the dot which follows the name
		info[:name] = stationname
		station.elements.each('P') { |platform|
			platformNum = platform.attributes['Num'].to_i
			info[:platforms][platformNum] = platform.attributes['N']
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
		}
		info
	end
	def get_platforms
		platforms = []
		@data.elements.each("ROOT/S/P") { |platformstatus|
			platform = {
				:name => platformstatus.attributes['N'],
				:number => platformstatus.attributes['Num'],
				:trackcode => platformstatus.attributes['TrackCode'],
				:trains => [],
				:cssClass => @line.get_name.gsub(/[ &]/, '').downcase
			}
			platformstatus.elements.each("T") { |train|
				train.attributes['link'] = '/tube/'+@line.get_code+train.attributes['SetNo']
				if (train.attributes['SecondsTo'] == '0')
					train.attributes['now'] = true
				end
				if (train.attributes['SetNo'] == '000')
					train.attributes['ghost'] = true
				end
				platform[:trains] << train.attributes
			}
			platforms << platform
		}
		platforms
	end
end
