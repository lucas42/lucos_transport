
include REXML

class TubeController < Mustache
	self.template_file = 'templates/lines.html'
	def initialize (network)
		self[:link] = '/tube/'
		self[:title] = 'Tube'
		self[:lines] = []
		network.get_lines.each() { |line|
			status = network.get_status(line.get_code)
			self[:lines] << {
				:name => line.get_name,
				:link => '/tube/'+URI.escape(line.get_name, Regexp.new("[^#{URI::PATTERN::UNRESERVED}]")),
				:status => status[:status],
				:cssClass => line.get_name.gsub(/[ &]/, '').downcase,
				:details => status[:details],
			}
		}
	end
end
