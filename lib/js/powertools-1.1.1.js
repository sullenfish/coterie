// packager build Class-Extras/Class.Singleton EventStack/EventStack.OuterClick Tree/Collapse.Persistent
/*
---

name: Class.Singleton

description: Beautiful Singleton Implementation that is per-context or per-object/element

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Class]

provides: Class.Singleton

...
*/

(function(){

var storage = {

	storage: {},

	store: function(key, value){
		this.storage[key] = value;
	},

	retrieve: function(key){
		return this.storage[key] || null;
	}

};

Class.Singleton = function(){
	this.$className = String.uniqueID();
};

Class.Singleton.prototype.check = function(item){
	if (!item) item = storage;

	var instance = item.retrieve('single:' + this.$className);
	if (!instance) item.store('single:' + this.$className, this);

	return instance;
};

var gIO = function(klass){

	var name = klass.prototype.$className;

	return name ? this.retrieve('single:' + name) : null;

};

if (('Element' in this) && Element.implement) Element.implement({getInstanceOf: gIO});

Class.getInstanceOf = gIO.bind(storage);

})();

/*
---

name: Class.Binds

description: A clean Class.Binds Implementation

authors: Scott Kyle (@appden), Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Class, Core/Function]

provides: Class.Binds

...
*/

Class.Binds = new Class({

	$bound: {},

	bound: function(name){
		return this.$bound[name] ? this.$bound[name] : this.$bound[name] = this[name].bind(this);
	}

});

/*
---

name: EventStack

description: Helps you Escape.

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Class.Extras, Core/Element.Event, Class-Extras/Class.Binds]

provides: EventStack

...
*/

(function(){

this.EventStack = new Class({

	Implements: [Options, Class.Binds],

	options: {
		event: 'keyup',
		condition: function(event){
			return (event.key == 'esc');
		}
	},

	initialize: function(options){
		this.setOptions(options);
		this.stack = [];
		this.data = [];

		document.addEvent(this.options.event, this.bound('condition'));
	},

	condition: function(event){
		if (this.options.condition.call(this, event, this.data.getLast()))
			this.pop(event);
	},

	erase: function(fn){
		this.data.erase(this.data[this.stack.indexOf(fn)]);
		this.stack.erase(fn);

		return this;
	},

	push: function(fn, data){
		this.erase(fn);
		this.data.push(data || null);
		this.stack.push(fn);
		
		return this;
	},

	pop: function(event){
		var fn = this.stack.pop(),
			data = this.data.pop();
		
		if (fn) fn.call(this, event, data);

		return this;
	}

});

}).call(this);


/*
---

name: EventStack.OuterClick

description: Helps you escape from clicks outside of a certain area.

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [EventStack]

provides: EventStack.OuterClick

...
*/

EventStack.OuterClick = new Class({

	Extends: EventStack,

	options: {
		event: 'click',
		condition: function(event, element){
			return element && !element.contains(event.target);
		}
	}

});


/*
---

name: Collapse

description: Allows to expand or collapse a list or a tree.

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Events, Core/Element.Event, Core/Element.Style, Core/Element.Dimensions, Core/Fx, More/Element.Delegation, Class-Extras/Class.Singleton]

provides: Collapse

...
*/

(function(){

this.Collapse = new Class({

	Implements: [Options, Class.Singleton],

	options: {
		animate: true,
		fadeOpacity: 0.5,
		className: 'collapse',
		selector: 'a.expand',
		listSelector: 'li',
		childSelector: 'ul'
	},

	initialize: function(element, options){
		this.setOptions(options);
		element = this.element = document.id(element);

		return this.check(element) || this.setup();
	},

	setup: function(){
		var self = this;
		this.handler = function(e){
			self.toggle(this, e);
		};

		this.mouseover = function(){
			if (self.hasChildren(this)) this.getElement(self.options.selector).fade(1);
		};

		this.mouseout = function(){
			if (self.hasChildren(this)) this.getElement(self.options.selector).fade(self.options.fadeOpacity);
		};

		this.prepare().attach();
	},

	attach: function(){
		var element = this.element;
		element.addEvent('click:relay(' + this.options.selector + ')', this.handler);
		if (this.options.animate){
			element.addEvent('mouseover:relay(' + this.options.listSelector + ')', this.mouseover);
			element.addEvent('mouseout:relay(' + this.options.listSelector + ')', this.mouseout);
		}
		return this;
	},

	detach: function(){
		this.element.removeEvent('click:relay(' + this.options.selector + ')', this.handler)
				.removeEvent('mouseover:relay(' + this.options.listSelector + ')', this.mouseover)
				.removeEvent('mouseout:relay(' + this.options.listSelector + ')', this.mouseout);
		return this;
	},

	prepare: function(){
		this.prepares = true;
		this.element.getElements(this.options.listSelector).each(this.updateElement, this);
		this.prepares = false;
		return this;
	},

	updateElement: function(element){
		var child = element.getElement(this.options.childSelector),
			icon = element.getElement(this.options.selector);

		if (!this.hasChildren(element)){
			if (!this.options.animate || this.prepares) icon.setStyle('opacity', 0);
			else icon.fade(0);
			return;
		}

		if (this.options.animate) icon.fade(this.options.fadeOpacity);
		else icon.setStyle('opacity', this.options.fadeOpacity);

		if (this.isCollapsed(child)) icon.removeClass('collapse');
		else icon.addClass('collapse');
	},

	hasChildren: function(element){
		var child = element.getElement(this.options.childSelector);
		return (child && child.getChildren().length);
	},

	isCollapsed: function(element){
		return (element.getStyle('display') == 'none');
	},

	toggle: function(element, event){
		if (event) event.preventDefault();

		if (!element.match(this.options.listSelector)) element = element.getParent(this.options.listSelector);

		if (this.isCollapsed(element.getElement(this.options.childSelector))) this.expand(element);
		else this.collapse(element);

		return this;
	},

	expand: function(element){
		element.getElement(this.options.childSelector).setStyle('display', 'block');
		element.getElement(this.options.selector).addClass(this.options.className);
		return this;
	},

	collapse: function(element){
		element.getElement(this.options.childSelector).setStyle('display', 'none');
		element.getElement(this.options.selector).removeClass(this.options.className);
		return this;
	}

});

})();


/*
---

name: Collapse.Persistent

description: Interface to automatically save the state to persistent storage.

authors: [Christoph Pojer (@cpojer), Sean McArthur (@seanmonstar)]

license: MIT-style license.

requires: [Collapse]

provides: Collapse.Persistent

...
*/

(function(){

this.Collapse.Persistent = new Class({

	Extends: this.Collapse,

	options: {

		getAttribute: function(element){
			return element.get('id');
		},

		getIdentifier: function(element){
			return 'collapse_' + element.get('id') + '_' + element.get('class').split(' ').join('_');
		}

	},

	setup: function(){
		this.key = this.options.getIdentifier.call(this, this.element);
		this.state = this.getState();
		this.parent();
	},

	prepare: function(){
		var obj = this.state;
		this.element.getElements(this.options.listSelector).each(function(element){
			if (!element.getElement(this.options.childSelector)) return;

			var state = obj[this.options.getAttribute.call(this, element)];
			if (state == 1) this.expand(element);
			else if (state == 0) this.collapse(element);
		}, this);

		return this.parent();
	},

	getState: function(){
		return {};
	},

	setState: function(element, state){
		this.state[this.options.getAttribute.call(this, element)] = state;
		return this;
	},

	expand: function(element){
		this.parent(element);
		this.setState(element, 1);
		return this;
	},

	collapse: function(element){
		this.parent(element);
		this.setState(element, 0);
		return this;
	}

});

})();

