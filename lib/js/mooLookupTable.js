/*
---

name: MooLookupTable

description: Query table elements like flat file databases, client-side. Return text or html.

license: MIT-style license.

copyright: Copyright (c) 2011 [Frederick J. Ostrander](http://sullenfish.com/).

authors: Frederick J. Ostrander (http://sullenfish.com/)

requires:
	-	Core
	-	/MooLookupTable

provides: [MooLookupTable]

...
*/

var MooLookupTable = new Class({
	Implements: [Options],
	options: {
		'case-sensitive': false,
		output: 'text'
	},
    initialize: function(table, primaryKey, options) {
    	if (arguments.length == 2 && typeOf(primaryKey) == 'object'){
    		options = primaryKey;
    		primaryKey = null;
    	}
    	this.setOptions(options);
        // set table
        if (table) {
        	if (typeOf(table) == 'string' || typeOf(table) == 'textnode'){
        		this.table = document.id(table);
        		if (!this.table){
        			return false;
        		}
        	} else {
            	this.table = table;
            }
        } else {
            return false;
        }
        // set primary key
        switch (typeOf(primaryKey)) {
        case 'element':
        case 'textnode':
            primaryKey = primaryKey.get('text');
            break;
        case 'string':
            break;
        default:
            var pk = this.table.getElement('thead .primary-key');
            primaryKey = pk ? pk.get('text') : null;
        }
        this.primaryKey = primaryKey ? primaryKey : this.table.getElement('th').get('text');
        // set default output type
        this.output = (this.options.output == 'text' || this.options.output == 'html') ? this.options.output : 'text';
        // set case sensitivity
        this.caseSensitive = this.options['case-sensitive'];
    },
    lookup: function(primaryKeyValue, keys, output) {
    	var output = output ? ((output == 'text' || output == 'html') ? output : this.output) : this.output;
        if (!primaryKeyValue || !keys) {
            return null;
        }
        keys = Array.from(keys);
        var values = [],
            primaryColumn = this.table.getElements('thead ^ tr th').map(function(item) {
                return this.caseSensitive ? item.get('text') : item.get('text').toLowerCase();
            }).indexOf(this.caseSensitive ? this.primaryKey : this.primaryKey.toLowerCase()),
            primaryRow = this.table.getElements('tbody tr td:nth-child(' + (primaryColumn + 1) + ')').map(function(item) {
                return this.caseSensitive ? item.get('text') : item.get('text').toLowerCase();
            }).indexOf(this.caseSensitive ? primaryKeyValue : primaryKeyValue.toLowerCase());
        if (primaryRow < 0) return null; // primary key value not found
        keys.each(function(key) {
            var keyColumn = this.table.getElements('thead ^ tr th').map(function(item) {
                return this.caseSensitive ? item.get('text') : item.get('text').toLowerCase();
            }).indexOf(this.caseSensitive ? key : key.toLowerCase());
            if (keyColumn >= 0){ // key column was found
            	values.push(this.table.getElement('tbody tr:nth-child(' + (primaryRow + 1) + ') td:nth-child(' + (keyColumn + 1) + ')').get(output));
            }
        }, this);
        return values;
    }
});