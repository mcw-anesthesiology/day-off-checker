import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Locations } from '../../api/locations.js';
import { DayOffRequests } from '../../api/day-off-requests.js';

const locations = [
	{
		_id: "froedtert",
		name: "Froedtert",
		number: "123-456-7890",
		administrator: { // FIXME
			name: "Cherry",
			email: "cherry@mcw.edu"
		}
	},
	{
		_id: "childrens",
		name: "Children's Hospital",
		number: "325-234-2634",
		administrator: { // FIXME
			name: "Children's Admin",
			email: "childrens@chw.edu"
		}
	},
	{
		_id: "va",
		name: "VA",
		number: "114-143-5135",
		administrator: { // FIXME
			name: "VA Admin",
			email: "admin@va.gov"
		}
	}
];

const accounts = [
	{
		name: "Test",
		username: "test",
		password: "test"
	},
	{
		name: "Amy Matenaer",
		username: "amatenaer",
		password: "test",
		email: "amatenaer@mcw.edu",
		notify: true
	},
	{
		name: "Ana Cox",
		username: "acox",
		password: "test",
		email: "acox@mcw.edu",
		chief: true,
		notify: true
	}
];



Meteor.startup(() => {
	Locations.remove({});
	for(let location of locations){
		Locations.insert(location);
	}

	for(let account of accounts){
		if(!Accounts.findUserByUsername(account.username))
			Accounts.createUser(account);
	}
});
