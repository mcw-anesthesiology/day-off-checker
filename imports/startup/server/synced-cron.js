import { SyncedCron } from 'meteor/percolate:synced-cron';
import { sendReminders } from '../../api/reminder-emails.js';

sendReminders();
SyncedCron.add({
	name: 'Send reminder emails',
	schedule: function(parser){
		return parser.text('at 8:00 am');
	},
	job: function(){
		return sendReminders();
	}
});
SyncedCron.start();
