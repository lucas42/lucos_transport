
class WrapperController < Mustache
	self.template_file = 'templates/page.html'
	def initialize (controller)
		self[:content] = controller.render
		self[:cssClass] = controller[:cssClass]
		self[:parent] = controller[:parent]
		if (!controller[:title].nil?)
			self[:title] = " - "+controller[:title]
		end
	end
end
