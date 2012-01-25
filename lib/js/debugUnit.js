/*
---
name: debugUnit

description: Provides simple console output to a dom element.

license: MIT-style

authors:
- Frederick J. Ostrander

requires: [Unit]

provides: [debugUnit]

...
*/

try {
var debugUnit = new Unit({
	Prefix: 'debug',
	Uses: [debugSettings],
	initSetup: function(){
		this.consoleQueue = [];
		if (this.logToElement.enabled||Browser.ie6||Browser.ie7||Browser.ie8){
			this.subscribe('console.log', function(){
				this.consoleQueue.push(arguments);
			});
		} else {
			this.subscribe('console.log', this.parser);
		}
		this.publish('!console.log', ["%c%s%c debug unit has arrived", 'font-weight: bold;', (new Date()).toLocaleTimeString(), 'font-weight: normal;']);
	},
	parser: function(){
		if (arguments.length) {
			this.console.log.apply(this, arguments);
		}
	},
	readySetup: function(){
		this.console = (this.logToElement.enabled||Browser.ie6||Browser.ie7||Browser.ie8) ? (function(){
			var con = document.id(this.logToElement.id);
			if (this.logToElement.visible){
				con.setStyle('display', 'block');
			}
			return {
				log: function(){
					var args = Array.from(arguments).each(function(item){
						return String.from(item);
					}), message = '';
					/*  
					 *	From the Firebug Console API
					 * 
					 *	%s	 	String
					 *	%d, %i	Integer (numeric formatting is not yet supported)
					 *	%f		Floating point number (numeric formatting is not yet supported)
					 *	%o		Object hyperlink
					 *	%c		Style formatting
					 */
					var cFlag = false;
					while (args.length >= 2 && args[0].test(/%c|%d|%f|%i|%o|%s/)){
						//alert(args.length + ' -- ' + args[0].test(/%c|%d|%f|%i|%o|%s/) + ' -- ' + args[0] + ' -- ' + args[0].substr(args[0].search(/%c|%d|%f|%i|%o|%s/), 2));
						//alert(args[0].substr(args[0].search(/%c|%d|%f|%i|%o|%s/), 2));
						switch (args[0].substr(args[0].search(/%c|%d|%f|%i|%o|%s/), 2)) {
							case '%c':
								args.unshift(args.shift().replace('%c', (cFlag ? '<' + '/span>' : '') + '<span style="' + args.shift() + '">'));
								cFlag = true;
								break;
							case '%d':
								args.unshift(args.shift().replace('%d', args.shift()));
								break;
							case '%f':
								args.unshift(args.shift().replace('%f', args.shift()));
								break;
							case '%i':
								args.unshift(args.shift().replace('%i', args.shift()));
								break;
							case '%o':
								args.unshift(args.shift().replace('%o', JSON.encode(args.shift())));
								break;
							case '%s':
								args.unshift(args.shift().replace('%s', args.shift()));
								break;
						}
					}
					args.each(function(item, index){
						message += message != '' ? ' ' + item : item;
					});
					if (cFlag) {
						message += '<' +'/span>';
					}
					con.adopt(new Element('div', {
						html: message
					}));
				}
			}
		}).bind(this)() : console;
		while (this.consoleQueue.length > 0){
			this.parser.apply(this, this.consoleQueue.shift());
		}
		this.subscribe('console.log', this.parser);
	}
});
} catch(e){
	alert(e.message);
	//alert(window.Unit);
}