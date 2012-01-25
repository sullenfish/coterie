var CRMToolsHelpParser = new Class(
		{
			Implements : [ Class.Singleton, Events, Options ],
			options : {
				article : 'article',
				console : 'debug',
				content : 'content',
				'copyright-date' : 'copyrightDate',
				debug : false,
				external : 'external',
				header : 'header',
				lookup : 'lookup',
				menu : 'menu',
				onMenuInit: function(){
					this.buildMenu();
				}
			},
			initialize : function(options) {
				return this.check() || this.setup(options);
			},
			setup : function(options) {
				this.setOptions(options);

				// initialize variables
				this.uri = new URI(); // current page URI
				this.qs = new Hash(this.uri.get('data'));
				this.article = document.id(this.options.article);
				this.console = document.id(this.options.console);
				this.content = document.id(this.options.content);
				this.header = document.id(this.options.header);
				this.external = document.id(this.options.external);
				this.lookup = document.id(this.options.lookup);
				this.menu = document.id(this.options.menu);
				this.smoothscroll = new Fx.SmoothScroll();

				// initialize debugging
				this.debug = this.options.debug;
				if (this.qs.has('debug')) {
					this.debug = ((this.qs.get('debug') == 'true') ? true
							: false);
				}
				this.console.log = function(message, prefix) {
					if (prefix) {
						prefix = prefix.capitalize() + ': ';
					} else {
						prefix = '';
					}
					this.console.adopt(new Element('p[html=' + (new Date).toLocaleTimeString() + ' '
							+ prefix + message + ']'));
				}.bind(this);
				if (this.debug) {
					this.console.setStyle('display', 'block');
				}
				// execute
				this.loadDB();
				this.updateCopyrightDate();
				//this.browserFix();
			},
			browserFix : function() {
				if (Browser.ie6) {
					/* fix content height for IE6 */
					if (this.content.getSize().y < 490) {
						this.content.setStyle('height', 464);
					}
					
					/* resize menu to match content size */
					this.menu.setStyle('height', this.content.getSize().y);

					/* add hovers to IE6 li elements */
					$$('ul,li').addClass('gainlayout');
					$$('li').addEvents({
						mouseenter : function() {
							this.addClass('hover');
						},
						mouseleave : function() {
							this.removeClass('hover');
						}
					});
					
					/* pin menu in place */
					this.menu.setStyles({
						'left': 0,
						'position': 'absolute'
					});
					this.menu.set('tween', {'duration': 'short', 'link': 'cancel', 'transition': 'sine:out'});
					window.addEvent('scroll', function(){
						var scroll = window.getScroll();
						if (scroll.y >= this.content.getPosition().y) {
							this.menu.tween('top', scroll.y-this.content.getPosition().y+3);
						} else {
							this.menu.tween('top', '4px');
						}
					});
				} else {
					window.addEvent('scroll', function(){
						var scroll = window.getScroll();
						if (scroll.y >= (this.content.getPosition().y)) {
							this.menu.setStyles({
								'position': 'fixed',
								left: '4px',
								top: '-4px' //this.content.getPosition().y
							});
						} else {
							this.menu.setStyles({
								'position': 'relative',
								left: 0,
								top: 0
								//'top': this.content.getPosition().y /*- 34*/
							});
						}
					});
				}
				if (Browser.ie && Browser.version < 9) {
					/* resize the window if it's too small */
					if (window.getSize().x < 1200){
						window.resizeTo(1200, window.getSize().x);
					}
				}
				// reposition the browser to match parent or fall back to upper left
				var winPos = window.parent.getPosition();
				window.moveTo(winPos.x, winPos.y);
				//alert(this.header.getCoordinates().bottom + ' ' + this.content.getCoordinates().top);
			},
			buildMenu : function() {
				try {
					// set id properties of existing menu items
					this.menu.getElement('ul').getChildren('li').each(
							function(item) {
								item.set('id', this.menu.get('id')
										+ ':'
										+ item.get('html').split('<')[0]
												.clean());
								item.getElements('li').each(
										function(subItem) {
											subItem.set('id', subItem
													.getParent('li').get('id')
													+ ':'
													+ subItem.get('html')
															.clean());
										}, this);
							}, this);
					// alert(this.menu.get('html'));
					// build a hash table of menu items
					var menuObj = {};
					this.lookup.getElements('tbody tr').each(
							function(item, index) {
								var menuValue = lookuptable(this.lookup, 'id',
										index.toString(), 'menu')[0];
								if (menuValue
										&& (menuValue = menuValue.clean())) {
									menuValue = menuValue.split(':');
									var tempObj = {};
									if (menuValue.length == 1) {
										tempObj[menuValue] = {
											parentEntry : lookuptable(this.lookup,
													'id', index.toString(),
													'target')
										};
									} else {
										var tempSubObj = {};
										tempSubObj[menuValue[1]] = lookuptable(
												this.lookup, 'id', index
														.toString(), 'target');
										tempObj[menuValue[0]] = tempSubObj;
									}
									Object.merge(menuObj, tempObj);
								}
							}, this);
					// for each key in the menu hash, build or attach to the
					// navigation menu
					function attachMenuItem(value, key) {
						if (!document.id(document.getElementById(this.menu.get('id') + ':' + key))) {
							var listItem = new Element('li', {
								id : this.menu.get('id') + ':' + key,
								text : key
							});
							if (value.parentEntry) { // && Object.getLength(value) == 1) {
								listItem.set({
									'class' : 'link',
									events : {
										click : function() {
											this.redirect(value.parentEntry[0])
										}.bind(this)
									}
								});
							}						
							this.menu.getElement('ul').adopt(listItem);
							if (Object.some(value, function(subValue, subKey){
								return subKey !== 'parentEntry';
							}, this)) {
								listItem.adopt(new Element('ul'));
								Object.each(value, function(subValue, subKey) {
									if (subKey !== 'parentEntry') {
										var subListItem = new Element('li', {
											'class' : 'link',
											events : {
												click : function() {
													this.redirect(subValue[0]);
													return false;
												}.bind(this)
											},
											id : listItem.get('id') + ':' + subKey,
											text : subKey
										});
										listItem.getElement('ul')
												.adopt(subListItem);
									}
								}, this);
							} /* else {
								listItem.set({
									'class' : 'link',
									events : {
										click : function() {
											this.redirect(value[0]);
										}.bind(this)
									}
								});
							} */
						} else { // top if
							if (typeOf(value) == 'object') {
								Object.each(value, function(subValue, subKey) {
									if ((subKey !== 'parentEntry') && !document.id(document.getElementById(
											this.menu.get('id') + ':' + key + ':' + subKey))) {
										var subMenu;
										if (document.id(document.getElementById(this.menu.get('id') + ':' + key)).getElement('ul')){
											subMenu = document.id(document.getElementById(this.menu.get('id') + ':' + key)).getElement('ul');
										} else {
											subMenu = new Element('ul');
											document.id(document.getElementById(this.menu.get('id') + ':' + key)).adopt(subMenu);
										}
										subMenu.adopt(new Element('li', {
											id : subMenu.getParent().get('id') + ':' + subKey,
											text : subKey
										}));
									}
									// stupid IE6 workaround
									
									document.id(document.getElementById(
											this.menu.get('id')
													+ ':'
													+ key
													+ (subKey == 'parentEntry' ? ''
															: ':' + subKey)))
											.set({
												'class' : 'link',
												events : {
													click : function() {
														this.redirect(subValue[0]);
														return false;
													}.bind(this)
												}
											});
								}, this);
							} else {
								document.id(document.getElementById(this.menu.get('id') + ':' + key))
										.set({
											'class' : 'link',
											events : {
												click : function() {
													this.redirect(value[0]);
												}.bind(this)
											}
										});
							}
						}
					}
					Object.each(menuObj, attachMenuItem, this);
				} catch (e) {
					alert(e.message);
				}
				this.browserFix();
			},
			loadDB : function() {
				var dbURL = this.qs.has('db') ? this.qs.get('db') : './pages/db.html';
				var xhr = new Request.HTML({
					url : dbURL,
					method : 'get',
					onSuccess : function(responseTree, responseElements,
							responseHTML) {
						this.lookup.getElement('tbody').adopt(
								(new Element('div', {
									html : responseHTML
								})).getElement('tbody').getChildren());
						this.fireEvent('menuInit');
						this.processQueryString();
					}.bind(this),
					onFailure : function(responseXHR) {
						if (responseXHR.status == 0) { // local file request
							this.lookup.getElement('tbody').adopt(
									(new Element('tbody', {
										html : responseXHR.responseXML.body
												.getElement('tbody')
												.get('html')
									})).getChildren());
							this.fireEvent('menuInit');
							this.processQueryString();
						} else {
							this.console
									.log('XHR Error: ' + responseXHR.status);
						}
					}.bind(this)
				}).get();
			},
			loadPage: function(contentPages, referencePages) {
				this.smoothscroll.toTop();
				var contentPage = (new Element('div', {html: contentPages[0]})).getElement('a').get('href');
				if (!contentPage){
					return false;
				}
				this.article.set('load', {
					method : 'get',
					onFailure : function(responseXHR) {
						if (responseXHR.status == 0) { // local file
							// request
							this.article.set('html',
									responseXHR.responseXML.body
											.get('html'));
						} else {
							this.console.adopt(new Element(
									'p[text=XHR Error: '
											+ responseXHR.status + ']'));
						}
					}.bind(this)
				});
				this.article.load(contentPage);
				var references = new Element('div', {html: referencePages[0]});
				this.external.empty();
				if (references.getElements('a').length) {
					references.getElements('a').set('target', '_blank');
					var list, qhd = [], adr = [];
					references.getElements('a').each(function(item){
						if (item.get('text').contains('Demo:')) {
							item.set('text', item.get('text').substr(5));
							qhd.push(item);
						} else {
							adr.push(item);
						}
					}, this);
					if (qhd.length) {
						this.external.adopt(new Element('h2[text=Quick Hit Demonstrations]'));
						list = new Element('ul');
						qhd.each(function(item){
							li = new Element('li');
							li.adopt(item);
							list.adopt(li);							
						});
						this.external.adopt(list);
					}
					if (adr.length) {
						this.external.adopt(new Element('h2[text=Additional Resources]'));
						list = new Element('ul');
						adr.each(function(item){
							li = new Element('li');
							li.adopt(item);
							list.adopt(li);							
						});
						this.external.adopt(list);
					}
				}
				return true;
			},
			processQueryString : function() {
				if (this.qs.has('action')) { // perform explicit action
					switch (this.qs.get('action')) {
					case 'beautify':
						require(['./lib/js/PIE.js'], function(){
							$$('#content, #menu').each(function(item){
								PIE.attach(item);
							});
						});
						break;
					case 'redirect':
						if (this.qs.has('uri')) {
							document.location = this.qs.get('uri');
							return;
						}
						break;
					default:
					}
				}
				if (this.qs.has('module')) { // perform implicit action
					var moduleLookup = subtable(this.lookup, 'module', this.qs
							.get('module'));
					// test for popup
					if (this.qs.has('popup')) {
						var popupContent = lookuptable(moduleLookup, 'popup',
								this.qs.get('popup'), 'content pages', {
									output : 'html'
								});
						var popupReferences = lookuptable(moduleLookup, 'popup',
								this.qs.get('popup'), 'reference pages', {
							output : 'html'
						});
						if (popupContent) {
							if (!this.loadPage(popupContent, popupReferences)) {
								this.qs.erase('popup');
								this.processQueryString();
								return;
							}
						} else {
							this.console.log(
									this.qs.get('popup') + ' - No match in db. Attempting fallback.',
									'popup')
							this.qs.erase('popup');
							this.processQueryString();
							return;
						}
						// test for screen
					} else if (this.qs.has('screen')) {
						var screenContent = lookuptable(moduleLookup, 'screen',
								this.qs.get('screen'), 'content pages', {
									output : 'html'
								});
						var screenReferences = lookuptable(moduleLookup, 'screen',
								this.qs.get('screen'), 'reference pages', {
							output : 'html'
						});
						if (screenContent) {
							if (!this.loadPage(screenContent, screenReferences)) {
								this.qs.erase('screen');
								this.processQueryString();
								return;
							}
						} else {
							this.console.log(
									this.qs.get('screen') + ' - No match in db. Attempting fallback.',
									'screen')
							this.qs.erase('screen');
							this.processQueryString();
							return;
						}
						// test for module
					} else {
						try {
							if (lookuptable(moduleLookup, 'module', this.qs
									.get('module'), 'action') == 'redirect') {
								var link = (new Element('div', {
									html : lookuptable(moduleLookup, 'module',
											this.qs.get('module'), 'content pages', {
												output : 'html'
											})
								})).getElement('a');
								this.uri.set('data', {
									action : 'redirect',
									uri : link.get('href')
								}).go();
							} else {
								var moduleContent = lookuptable(moduleLookup,
										'module', this.qs.get('module'),
										'content pages', {
											output : 'html'
										});
								var moduleReferences = lookuptable(moduleLookup, 'module',
										this.qs.get('module'), 'reference pages', {
									output : 'html'
								});
								if (moduleContent) {
									if (!this.loadPage(moduleContent, moduleReferences)) {
										this.qs.erase('module');
										this.processQueryString();
										return;
									}
								} else {
									this.console
											.log(
													this.qs.get('module') + ' - No match in db. Attempting fallback.',
													'module')
									this.qs.erase('module');
									this.processQueryString();
									return;
								}
							}
						} catch (e) {
							alert(e.message);
						}
					}
				} else {
					var moduleContent = lookuptable(this.lookup,
						'module', 'general',
						'content pages', {
							output : 'html'
						});
					var moduleReferences = lookuptable(this.lookup, 'module',
						'general', 'reference pages', {
							output : 'html'
						});
					if (moduleContent) {
						this.loadPage(moduleContent, moduleReferences);
					}
					/*
					this.article.set('load', {
						method : 'get',
						onComplete : function() {
							// alert(this.content.get('html'));
						}.bind(this),
						onFailure : function(responseXHR) {
							if (responseXHR.status == 0) { // local file
								// request
								this.article.set('html',
										responseXHR.responseXML.body
												.get('html'));
							} else {
								this.console.adopt(new Element(
										'p[text=XHR Error: '
												+ responseXHR.status + ']'));
							}
						}.bind(this)
					});
					this.article.load('./pages/general.html');
					*/
				}

				// debugging
				if (this.debug) {
					this.qs.getKeys().each(function(item) {
						if (this.qs.has(item)) {
							this.console.log(this.qs.get(item), item);
						}
					}, this);
					if (this.qs.has('module')) {
						var sublookup = subtable(this.lookup, 'module', this.qs
								.get('module'));
						if (this.qs.has('popup')) {
							this.console.log(lookuptable(sublookup, 'popup',
									this.qs.get('popup'), 'target'),
									'destination');
						} else if (this.qs.has('screen')) {
							this.console.adopt(new Element(
									'p[text=Destination: '
											+ lookuptable(sublookup, 'screen',
													this.qs.get('screen'),
													'target') + ']'));
						} else {
							this.console
									.adopt(new Element(
											'p[text=No screen or popup data identified in query string.]'));
							this.console.adopt(new Element(
									'p[text=Destination: '
											+ lookuptable(sublookup, 'module',
													this.qs.get('module'),
													'target') + ']'));
						}
					} else {
						this.console
								.adopt(new Element(
										'p[text=No module data identified in query string.]'));
					}
				}
			},
			redirect : function(obj) {
				if (typeOf(obj) == 'string') {
					var qsData = JSON.decode(obj);
					if (this.debug) {
						qsData.debug = 'true';
					}
					this.uri.set('data', qsData);
					this.qs = new Hash(this.uri.get('data'));
					this.processQueryString();
				}
			},
			updateCopyrightDate : function() {
				var copyrightDate = document.id(this.options['copyright-date']);
				var currentYear = (new Date()).getFullYear();
				if (Number.from(copyrightDate.get('text')) < currentYear) {
					copyrightDate.appendText('-' + currentYear);
				}
			}
		});