export default {
    filters: {
        weekday: date => date && typeof date.format === 'function' ? date.format('dddd') : 'Unknown',
        fulldate: date => date && typeof date.format === 'function' ? date.format('ddd, MMM D') : 'Unknown',
        hoursCount: date => {
            // Handle null, undefined or non-dayjs objects safely
            if (!date || typeof date.format !== 'function') {
                return '0:00'; // Default value
            }
            return date.format('H:mm');
        },
        uppercase: str => str ? str.toUpperCase() : '',
        dropTaskPrefixSuffix: taskName => taskName 
            ? taskName
                .replace(' (OPEX)', '')
                .replace(' (CAPEX)', '')
                .replace(/[0-9]+\. /, '')
            : ''
    }
}