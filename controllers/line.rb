
include REXML

class LineController < Mustache
	self.template_file = 'templates/line.html'
	def initialize (network, name)
		self[:name] = name
		self[:title] = name+' Line'
		self[:cssClass] = 'line_'+name.gsub(/[ &]/, '').downcase
		self[:link] = '/tube/'+URI.escape(name, Regexp.new("[^#{URI::PATTERN::UNRESERVED}]"))
		self[:parent] = {
			:link => '/tube/',
			:name => 'All Lines',
		}
		self[:stations] = []
		
		line = network.get_line(name)
		line.get_stations.each_pair do |code, station|
			self[:stations] << {
				:name => station.get_info[:name],
				:link => '/tube/'+code
			}
		end
		self[:stations] = self[:stations].sort_by { |station| station[:name] }
		
	end
end
