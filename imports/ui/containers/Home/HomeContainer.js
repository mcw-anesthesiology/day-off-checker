/* @flow */

import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import { Fellowships } from '../../api/fellowships.js';
import { Locations } from '../../api/locations.js';

import Home from '../components/Home.js';

const HomeContainer = withTracker(props => {
	const fellowshipsHandle = Meteor.subscribe('fellowships');
	const locationsHandle = Meteor.subscribe('locations');
	const chiefUserData = Meteor.subscribe('chiefUserData');

	const fellowships = fellowshipsHandle.ready()
		? Fellowships.find({}, { sort: { name: 1 } })
		: [];

	// const getLocations = locationsHandle.ready()
	// 	? (fellowship: ?string) =>
	// 	: (fellowship: ?string)


	return {
		...props,
		currentUser: Meteor.user(),
		fellowships,
	};
})(Home);

export default HomeContainer;
