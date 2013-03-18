#!/usr/bin/ruby -rubygems

require 'mustache'
require 'socket'
require 'net/http'
require 'uri'
require 'cgi'
require 'rexml/document'
require 'time'

# classes
require 'classes/network'
require 'classes/line'
require 'classes/dlrline'
require 'classes/pseudoline'
require 'classes/station'
require 'classes/dlrstation'

# controllers
require 'controllers/wrapper'
require 'controllers/fallback'
require 'controllers/tube'
require 'controllers/line'
require 'controllers/station'
require 'controllers/train'
require 'controllers/map'
require 'controllers/maplist'
require '../core/resources.rb'
include REXML

$stdout.sync = true
$stderr.sync = true
Thread.abort_on_exception = true
Mustache.template_path = 'templates'
Mustache.template_extension = 'html'

Resource.new('lucosjs', 'js', '../core/lucos.js')
Resource.new('mustache', 'js', 'js/mustache.js', true)
Resource.new('tubejs', 'js', 'js/tube.js')
Resource.new('networkjs', 'js', 'js/network.js')
Resource.new('linejs', 'js', 'js/line.js')
Resource.new('trainjs', 'js', 'js/train.js')
Resource.new('stationjs', 'js', 'js/station.js')
Resource.new('stopjs', 'js', 'js/stop.js')
Resource.new('tubespeakjs', 'js', 'js/tubespeak.js')

Resource.new('style', 'css', 'style.css')

Resource.new('stations', 'json', 'data/stations.json', true)
Resource.new('interchanges', 'json', 'data/interchanges.json', true)
Resource.new('symbols', 'json', 'data/symbols.json', true)

Resource.new('splashscreen', 'mus', 'templates/splashscreen.html', true)
Resource.new('error', 'mus', 'templates/error.html', true)
Resource.new('line', 'mus', 'templates/line.html', true)
Resource.new('lines', 'mus', 'templates/lines.html', true)
Resource.new('map', 'mus', 'templates/map.html', true)
Resource.new('station', 'mus', 'templates/station.html', true)
Resource.new('train', 'mus', 'templates/train.html', true)


tube = Network.new({
		'B' => 'Bakerloo',
		'C' => 'Central',
		'D' => 'District',
		'H' => 'Hammersmith & City',
		'J' => 'Jubilee',
		'M' => 'Metropolitan',
		'N' => 'Northern',
		'P' => 'Piccadilly',
		'V' => 'Victoria',
		'W' => 'Waterloo & City',
	}, {
		'I' => 'Circle',
		'O' => 'Overground',
	})

server = TCPServer.open(8009)
puts 'server running on port 8009'	
loop {
	Thread.start(server.accept) do |client|
		header = nil
		while line = client.gets
			if header.nil?
				header = line
			end
			if line == "\r\n"
				break
			end
		end
		uri = URI(header.split(' ')[1])
		path = uri.path.gsub('..','').split('/')
		if uri.query.nil?
			uri_params = {}
		else
			uri_params = CGI.parse(uri.query)
		end
		begin
			case path[1]
				when nil
					client.puts("HTTP/1.1 302 Found")
					client.puts("Location: /tube/")
					client.puts("")
				when 'tube'
					case path[2]
						when nil
							controller = TubeController.new(tube)
						when 'fallback'
							controller = FallbackController.new("Page Not Found")
							
						when /^[A-Z]{3}$/
							controller = StationController.new(tube, path[2])
					
						when /^([A-Z])([0-9]+)$/
							controller = TrainController.new(tube, $1, $2)
							
						when /^[A-Z](%20|%26|[A-Za-z])*$/
							controller = LineController.new(tube, URI.unescape(path[2]))
							
						else
							raise "File Not Found"
					end
					client.puts("HTTP/1.1 200 OK")
					client.puts("Content-type: text/html")
					client.puts
					client.puts(WrapperController.new(controller).render)
				when 'resources'
					Resource.output(client, uri_params)
				when 'js'
					case path[2]
						when 'speakworker'
							client.puts("HTTP/1.1 200 OK")
							client.puts("Content-Type: text/javascript")
							client.puts()
						#	client.puts("importScripts('speakGenerator.js');
						#		
						#		onmessage = function(event) {
						#		  postMessage(generateSpeech(event.data.text, event.data.args));
						#		};
						#	")
					end
				when 'img'
					begin
						file = File.new('img/'+path[2].gsub('..','')+'.png')
					rescue Exception => e
						raise "Image Not Found"
					end
					client.puts("HTTP/1.1 200 OK")
					client.puts("Content-Type: image/png")
					client.puts()				
					client.puts(file.read)
					file.close
				when 'favicon.ico'
					begin
						file = File.new('img/favicon.png')
					rescue Exception => e
						raise "Image Not Found"
					end
					client.puts("HTTP/1.1 200 OK")
					client.puts("Content-Type: image/png")
					client.puts()				
					client.puts(file.read)
					file.close
				when 'fonts'	
					begin
						file = File.new('fonts/'+path[2].gsub('..','')+'.ttf')
					rescue Exception => e
						raise "Font Not Found"
					end
					client.puts("HTTP/1.1 200 OK")
					client.puts("Content-Type: font/ttf")
					client.puts()				
					client.puts(file.read)
					file.close
				when 'travel.manifest'	
					begin
						file = File.new('manifest')
					rescue Exception => e
						raise "Manifest Not Found"
					end
					client.puts("HTTP/1.1 200 OK")
					client.puts("Content-Type: text/cache-manifest")
					client.puts()				
					client.puts(file.read)
					file.close
				when 'preload'	
					begin
						file = File.new('../core/preload.xhtml')
					rescue Exception => e
						raise "Preload File Not Found"
					end
					client.puts("HTTP/1.1 200 OK")
					client.puts("Content-Type: application/xhtml+xml")
					client.puts()				
					client.puts(file.read.gsub('$manifest$', '/travel.manifest'))
					file.close
				when 'maps'
					case path[2]
						when nil
							controller = MapListController.new()
							client.puts("HTTP/1.1 200 OK")
							client.puts("Content-Type: text/html")
							client.puts
							client.puts(WrapperController.new(controller).render)
						when 'img'
							map = MapController.new(path[3])
							output = map.raw_render
							client.puts("HTTP/1.1 200 OK")
							client.puts("Content-Type: image/png")
							client.puts
							client.puts(output)
							file.close
						else
							controller = MapController.new(path[2])
							client.puts("HTTP/1.1 200 OK")
							client.puts("Content-Type: text/html")
							client.puts
							client.puts(WrapperController.new(controller).render)
						end
				when 'data'
					case path[2]
						when 'tube'
							op = tube.get_info
							expires = op[:expires].httpdate()
							op.delete('expires')
							client.puts("HTTP/1.1 200 OK")
							client.puts("Content-Type: application/json")
							client.puts("Expires: "+expires)
							client.puts
							client.puts(op.to_json)
						else
							raise "File Not Found"
						end
				else
					raise "File Not Found"
			end
		rescue Exception => e
			if e.message.end_with?("Not Found")
					client.puts("HTTP/1.1 404 "+e.message)
					client.puts
					client.puts(e.message)
			else
					client.puts("HTTP/1.1 500 Internal Error")
					client.puts
					client.puts(e.message)
					client.puts(e.backtrace)
			
			end
		end
		client.close
	end
}
