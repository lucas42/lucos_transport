class FallbackController < Mustache
	self.template_file = 'templates/error.html'
	def initialize (message)
		self[:message] = message
	end
end
