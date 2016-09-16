import './requests.html';

Template.requests.onRendered(function(){
	Session.set('requestsView', window.location.hash);
});

Template.requests.helpers({
	showCalendar(){
		return Session.equals('requestsView', '#calendar-view');
	}
});

Template.requests.events({
	'click .view-link'(event){
		let hash = event.target.getAttribute('href');
		Session.set('requestsView', hash);
	}
});
