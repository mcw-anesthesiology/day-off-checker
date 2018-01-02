/* @flow */

import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import { Locations } from '../../../api/locations.js';

import ResidentRequest from '../../components/Home/ResidentRequest.js';

const HomeContainer = withTracker(props => {
	const locationsHandle = Meteor.subscribe('locations');
	Meteor.subscribe('chiefUserData');

	const locations = locationsHandle.ready()
		? Locations.find({
			fellowship: { $exists: false }
		}, { sort: { name: 1 } })
		: [];
	const chiefs = Meteor.users.find({ role: 'chief' }, { pager: 1, name: 1 });

	return {
		...props,
		currentUser: Meteor.user(),
		locations,
		chiefs
	};
})(ResidentRequest);

export default HomeContainer;
