import './i-day-request.html';

Template.iDayRequest.helpers({
	requestDenied(confirmationRequest){
		return confirmationRequest.status === "denied";
	}
});
