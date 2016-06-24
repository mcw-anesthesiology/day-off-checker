/* eslint-disable */

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Locations } from '../../api/locations.js';
import { DayOffRequests } from '../../api/day-off-requests.js';

const locations = [
	{
		_id: "froedtert_east",
		name: "Froedtert OR East",
		number: "(414) 805-6262",
		administrator: "cherry.brania"
	},
	{
		_id: "froedtert_west",
		name: "Froedtert OR West",
		number: "(414) 805-2750",
		administrator: "cherry.brania"
	},
	{
		_id: "froedtert_birth_center",
		name: "Froedtert Birth Center",
		number: "(414) 805-3939",
		administrator: "cbrummer"
	},
	{
		_id: "froedtert_pain",
		name: "Froedtert Pain",
		number: "(414) 456-7600",
		administrator: "kjkuderer"
	},
	{
		_id: "childrens",
		name: "Children's Hospital",
		number: "OR operator at (414) 266-6000, option 2, ask for the person running the board. Sick line at (414) 337-7425, leave your name.",
		administrator: "mcombs"
	},
	{
		_id: "va",
		name: "VA",
		number: "(414) 384-2000 ext. 42417",
		administrator: "michelle.sawyers3"
	},
	{
		_id: "sjob",
		name: "Saint Joeseph's OB",
		number: "(414) 447-2967",
		administrator: "sabendro"
	}
];

const accounts = [
	{
		name: "Jacob Mischka",
		username: "jmischka",
		password: "test",
		email: "jmischka@mcw.edu",
		role: "admin"
	},
	{
		name: "Chris Fox",
		username: "cafox",
		password: "test",
		email: "cafox@mcw.edu",
		role: "admin"
	},
	{
		name: "Amy Matenaer",
		username: "amatenaer",
		password: "test",
		email: "amatenaer@mcw.edu",
		notify: true,
		role: "admin"
	},
	{
		name: "Ana Cox",
		username: "acox",
		password: "test",
		email: "acox@mcw.edu",
		pager: "(414) 917-0364",
		role: "chief"
	},
	{
		name: "Gwynne Kirchen",
		username: "gkirchen",
		password: "test",
		email: "gkirchen@mcw.edu",
		pager: "(414) 917-0365",
		role: "chief"
	},
	{
		name: "Cherry Brania",
		username: "cherry.brania",
		password: "test",
		email: "cherry.brania@froedtert.com",
		role: "location_admin"
	},
	{
		name: "Cathy Brummer",
		username: "cbrummer",
		password: "test",
		email: "cbrummer@mcw.edu",
		role: "location_admin"
	},
	{
		name: "Tammy Kuderer",
		username: "kjkuderer",
		password: "test",
		email: "kjkuderer@mcw.edu",
		role: "location_admin"
	},
	{
		name: "Michelle Combs",
		username: "mcombs",
		password: "test",
		email: "mcombs@mcw.edu",
		role: "location_admin"
	},
	{
		name: "Michelle Sawyers",
		username: "michelle.sawyers3",
		password: "test",
		email: "michelle.sawyers3@va.gov",
		role: "location_admin"
	},
	{
		name: "Sandy Abendroth",
		username: "sabendro",
		password: "test",
		email: "sabendro@mcw.edu",
		role: "location_admin"
	}
];

const fellowships = [

];


Meteor.startup(() => {
	if(Meteor.isDevelopment){
		if(Locations.find().count() === 0){
			for(let location of locations){
				Locations.insert(location);
			}
		}

		if(Meteor.users.find().count() === 0){
			for(let account of accounts){
				Accounts.createUser(account);
			}
		}
	}
});
