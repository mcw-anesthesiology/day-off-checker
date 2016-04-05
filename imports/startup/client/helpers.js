import { Template } from 'meteor/templating';

import moment from 'moment';

moment.updateLocale('en', {
	calendar: {
		lastDay: "[Yesterday], L",
		sameDay: "[Today], L",
		nextDay: "[Tomorrow], L",
		lastWeek: "[Last] dddd, L",
		nextWeek: "[Next] dddd, L",
		sameElse: "L"
	}
});

Template.registerHelper('displayDate', (date) => {
	return moment(date).calendar();
});
