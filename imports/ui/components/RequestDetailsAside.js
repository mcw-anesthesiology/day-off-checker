import React, { PropTypes } from 'react';
import moment from 'moment';

import { ReminderEmails } from '../../api/reminder-emails.js';

import {
	DAY_OFF_FIELDS,
	DAY_OFF_TYPES,
	DAYS_BEFORE_REQUEST_TO_SEND_REMINDER
} from '../../constants.js';
import {
	capitalizeFirstLetter,
	displayDate,
	displayNameByUsername,
	statusLabelType
} from '../../utils.js';

export default function RequestDetailsAside(props){
	let confirmationPanels = [];
	if(props.request.confirmationRequests){
		for(let confirmationRequest of props.request.confirmationRequests){
			confirmationPanels.push(
				<div key={confirmationRequest.confirmer} className="panel panel-default">
					<div className="panel-heading">
						<span className="panel-title">
							{displayNameByUsername(confirmationRequest.confirmer)}
						</span>
					</div>
					<div className="panel-body">
						<span className={`label ${statusLabelType(confirmationRequest.status)}`}>
							{capitalizeFirstLetter(confirmationRequest.status)}
						</span>
				{
					confirmationRequest.reason || confirmationRequest.note
					? (
						<p>
							{confirmationRequest.reason || confirmationRequest.note}
						</p>
					)
					: null
				}

					</div>
				</div>
			);
		}
	}

	let notificationPanels = [];
	if(props.request.usersNotified){
		for(let userNotified of props.request.usersNotified){
			let reminderContent;
			if(isRequest(props.request)){
				let reminder = ReminderEmails.findOne({
					requestId: props.request._id,
					remindedUser: userNotified
				});

				if(reminder){
					switch(reminder.status){
						case 'pending':
						reminderContent = <span className="label label-info">
							Reminder scheduled for {displayDate(reminder.remindTime)}
						</span>;
						break;
						case 'sent':
						reminderContent = <span className="label label-success">
							Reminder sent at {displayDate(reminder.remindTime)}
						</span>;
						break;
					}
				}
				else if(props.currentUser && props.currentUser.role === 'admin'
				&& reminderCanBeScheduled(props.request)){
					reminderContent = <button type="button" className="btn btn-info"
						data-username={userNotified} onClick={this.scheduleReminder}>
						Schedule reminder
					</button>;
				}
			}

			notificationPanels.push(
				<div key={userNotified} className="panel panel-default">
					<div className="panel-heading">
						<span className="panel-title">
							{displayNameByUsername(userNotified)}
						</span>
					</div>
					<div className="panel-body">
						<span className="label label-success">Notified</span>
						{reminderContent}
					</div>
				</div>
			);
		}
	}

	return (
		<div className="col-md-3 request-details-aside">

	{
		isRequest(props.request)
		? (
			<div className="request-status">
				<span className={`label ${statusLabelType(props.request.status)}`}>
					{capitalizeFirstLetter(props.request.status)}
				</span>
			</div>
		)
		: null
	}

			{confirmationPanels}
			{notificationPanels}


		</div>
	);
}

RequestDetailsAside.propTypes = {
	request: PropTypes.object.isRequired,
	currentUser: PropTypes.object,
	scheduleReminder: PropTypes.func.isRequired
};

function isRequest(request){
	return (request[DAY_OFF_FIELDS.TYPE] !== DAY_OFF_TYPES.SICK);
}

function reminderCanBeScheduled(request){
	return (request.requestedDate[0] > moment()
			.add(DAYS_BEFORE_REQUEST_TO_SEND_REMINDER, 'days')
		&& request.status === 'approved');
}
