import './requests.html';

let views = [
	'#table-view',
	'#calendar-view',
	'#stats-view'
];

Template.requests.onRendered(function(){
	if(window.location.hash.length > 0 && views.includes(window.location.hash))
		Session.set('requestsView', window.location.hash);

	if(!Session.get('requestsView'))
		Session.set('requestsView', '#table-view');
});

Template.requests.helpers({
	isActiveView(view){
		if(Session.equals('requestsView', view))
			return 'active';
	},
	showCalendar(){
		return Session.equals('requestsView', '#calendar-view');
	},
	showStats(){
		return Session.equals('requestsView', '#stats-view');
	}
});

Template.requests.events({
	'click .view-link'(event){
		let hash = event.target.getAttribute('href');
		if(views.includes(hash))
			Session.set('requestsView', hash);
	}
});
