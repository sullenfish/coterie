function lookuptable(table, primaryKey, primaryValue, lookupKeys, options){
	options = Object.append({
		'case-sensitive' : false,
		output: 'text'
	}, options);
	lookupKeys = Array.from(lookupKeys);
    var values = [],
        primaryColumn = table.getElements('thead ^ tr th').map(function(item) {
            return options['case-sensitive'] ? item.get('text') : item.get('text').toLowerCase();
        }).indexOf(options['case-sensitive'] ? primaryKey : primaryKey.toLowerCase());
    if (primaryColumn < 0) return null; // primary key not found
    var primaryRow = table.getElements('tbody tr td:nth-child(' + (primaryColumn + 1) + ')').map(function(item) {
            return options['case-sensitive'] ? item.get('text') : item.get('text').toLowerCase();
        }).indexOf(options['case-sensitive'] ? primaryValue : primaryValue.toLowerCase());
    if (primaryRow < 0) return null; // primary key value not found
    lookupKeys.each(function(key) {
        var keyColumn = table.getElements('thead ^ tr th').map(function(item) {
            return options['case-sensitive'] ? item.get('text') : item.get('text').toLowerCase();
        }).indexOf(options['case-sensitive'] ? key : key.toLowerCase());
        if (keyColumn >= 0){ // key column was found
        	var lookupValue = table.getElement('tbody tr:nth-child(' + (primaryRow + 1) + ') td:nth-child(' + (keyColumn + 1) + ')');
        	values.push(lookupValue ? lookupValue.get(options.output) : lookupValue);
        }
    }, this);
    return values;
}