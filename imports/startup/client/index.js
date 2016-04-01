import moment from 'moment';

import './routes.js';
import './helpers.js';
import './accounts-config.js';
import '../../ui/templates/accounts.js';
import 'nodep-date-input-polyfill';

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
