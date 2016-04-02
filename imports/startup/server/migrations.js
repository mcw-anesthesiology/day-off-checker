import { Meteor } from 'meteor/meteor';
import { Locations } from '../../api/locations.js';
import { DayOffRequests } from '../../api/day-off-requests.js';

Migrations.add({
	version: 1,
	up() {
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

		for(let location of locations){
			Locations.insert(location);
		}

		Meteor.createAccount({ name: "Test", username: "test", password: "test" }); // FIXME
		Meteor.createAccount({ name: "Amy Matenaer", username: "amatenaer", password: "test", email: "amatenaer@mcw.edu", notify: true }); // FIXME
		Meteor.createAccount({ name: "Ana Cox", username: "acox", password: "test", email: "acox@mcw.edu", chief: true, notify: true });
	},
	down(){
		Locations.remove({});
	}
});
