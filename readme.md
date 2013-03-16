#lucos Transport
A web app for keeping track of public transport, particularly on forms of transport where data connections are highly variable.

## Dependancies
* ruby
* [mustache (ruby implementation)](https://github.com/defunkt/mustache)
* [mustache (js implementation)](http://github.com/janl/mustache.js) - currently bundled as a static file in the project
* [lucos core](https://github.com/lucas42/lucos_core)

## Forms of transport currently supported:
* London Underground
* Docklands Light Railway

## Running
The web server is designed to be run within lucos_services, but can be run standalone by running server.rb with ruby.  It currently runs on port 8009.
