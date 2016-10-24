import { Template } from 'meteor/templating';

import ManageRequest from '../components/ManageRequest.js';

import './manageRequest.html';

Template.manageRequest.helpers({
	ManageRequest(){
		return ManageRequest;
	}
});
