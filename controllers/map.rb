
class MapController < Mustache
	self.template_file = 'templates/map.html'
	def initialize (path)
		self[:mapsrc] = '/maps/img/'+path
		self[:title] = 'Map'
		begin
			@file = File.new('maps/'+path+'.png')
		rescue Exception => e
			raise "Map Not Found"
		end
	end
	
	def raw_render
		output = @file.read
		@file.close
		output
	end
	
	def html_render
		@file.close
		self.render
	end
end