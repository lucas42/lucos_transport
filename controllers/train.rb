
include REXML

class TrainController < Mustache
	self.template_file = 'templates/train.html'
	def initialize (network, linecode, set)
		line = network.get_line(linecode)
		xml = Net::HTTP.get_response(URI.parse('http://cloud.tfl.gov.uk/TrackerNet/PredictionSummary/'+line.get_code)).body
		status = Document.new(xml)
		location = nil
		destination = nil
		stops = []
		status.elements.each("ROOT/S/P/T[@S='"+set+"']") { |train| 
			if ( self[:location].nil? or train.attributes['L'] != 'At platform' )
				self[:location] = train.attributes['L']
			end
			if ( self[:destination].nil? or train.attributes['DE'] != 'Unknown' )
				self[:destination] = train.attributes['DE'].sub(/\(.*\)/, '')
			end
			self[:set] = train.attributes['S']
			platform = train.parent
			station = platform.parent
			time = train.attributes['C'].split(':')
			time = (60 * time[0].to_i) + time[1].to_i
			stops << {
				'station' => { 'code' => station.attributes['Code'], 'name' => station.attributes['N'].chop.sub(/\(.*\)/, '') },
				'platform' => { 'name' => platform.attributes['N'] },
				'secondsTo' => time,
				'link' => '/tube/'+station.attributes['Code'],
			}
		}
		if self[:location].nil?
			raise "Train Not Found"
		end
		
		# Sort the stop in the order the train is due to arrive at them
		self[:stops] = stops.sort_by { |stop| stop['secondsTo'] }
		self[:nextstation] = self[:stops].first['station']['name']
		self[:nextstationcode] = self[:stops].first['station']['code']
		self[:nexttime] = self[:stops].first['time']
		self[:link] = '/tube/'+line.get_code+self[:set]
		self[:linename] = line.get_name
		self[:linelink] = '/tube/'+URI.escape(line.get_name, Regexp.new("[^#{URI::PATTERN::UNRESERVED}]"))
		self[:title] = line.get_name+' '+self[:set]
	end
end
