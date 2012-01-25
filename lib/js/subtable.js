/**
 * @author ostranfj
 */
function subtable(table, key, value, options) {
	options = Object.append({
		'case-sensitive' : false
	}, options);
	var target = new Element('table');
	target.adopt(table.getElement('thead').clone());
	var header = Array.from(table.getElements('th').get('text'));
	if (!options['case-sensitive']) {
		key = key.toLowerCase();
		value = value.toLowerCase();
		header = header.map(function(item) {
			return item.toLowerCase();
		});
	}
	var column = header.indexOf(key);
	if (column >= 0) {
		var rows = table.getElements('tbody tr').filter(
				function(row) {
					row = row.getElement('td:nth-child(' + (column + 1) + ')')
							.get('text');
					if (!options['case-sensitive']) {
						row = row.toLowerCase();
					}
					return (row == value);
				});
		var tbody = new Element('tbody');
		tbody.adopt(rows.map(function(row) {
			return row.clone();
		}));
		target.adopt(tbody);
	}
	return target;
}