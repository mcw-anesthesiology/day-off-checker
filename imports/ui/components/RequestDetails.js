import React, { Component } from 'react';
import PropTypes from 'prop-types';
import find from 'lodash/find';
import moment from 'moment';
import { throwError } from 'meteor/saucecode:rollbar';

import RequestDetailsMain from './RequestDetailsMain.js';
import RequestDetailsAside from './RequestDetailsAside.js';
import ErrorAlert from './ErrorAlert.js';

import {
	ADMIN_EMAIL_ADDRESS,
	DAY_OFF_FIELDS,
	DAY_OFF_TYPES,
	DAY_OFF_TYPE_NAMES,
	DAYS_BEFORE_REQUEST_TO_SEND_REMINDER
} from '../../constants.js';
import {
	camelCaseToWords,
	capitalizeFirstLetter,
	displayNameByUsername,
	escapeNewlines
} from '../../utils.js';

export default class RequestDetails extends Component {
	constructor(props){
		super(props);

		let currentUserConfirmationRequest;
		if(props.request && props.currentUser){
			currentUserConfirmationRequest = find(props.request.confirmationRequests,
				{confirmer: props.currentUser.username}
			);
		}

		this.state = {
			error: '',
			currentUserConfirmationRequest: currentUserConfirmationRequest,
			approveNote: currentUserConfirmationRequest && currentUserConfirmationRequest.note
				? currentUserConfirmationRequest.note
				: '',
			denyReason: currentUserConfirmationRequest && currentUserConfirmationRequest.reason
				? currentUserConfirmationRequest.reason
				: '',
			resendUsernames: []
		};

		this.isRequest = this.isRequest.bind(this);
		this.scheduleReminder = this.scheduleReminder.bind(this);
		this.handleApproveNoteInput = this.handleApproveNoteInput.bind(this);
		this.handleDenyReasonInput = this.handleDenyReasonInput.bind(this);
		this.handleApprovalSubmit = this.handleApprovalSubmit.bind(this);
		this.handleDenialSubmit = this.handleDenialSubmit.bind(this);
		this.handleEditApprovalNoteSubmit = this.handleEditApprovalNoteSubmit.bind(this);
		this.handleChangeResendUsernames = this.handleChangeResendUsernames.bind(this);
		this.handleSubmitResendConfirmationRequests = this.handleSubmitResendConfirmationRequests.bind(this);
		this.handleCancelReasonInput = this.handleCancelReasonInput.bind(this);
		this.handleCancelRequestClick = this.handleCancelRequestClick.bind(this);
		this.setError = this.setError.bind(this);
		this.handleErrorClose = this.handleErrorClose.bind(this);
	}

	componentWillReceiveProps(props){
		let currentUserConfirmationRequest;
		if(props.request && props.currentUser){
			currentUserConfirmationRequest = find(props.request.confirmationRequests,
				{confirmer: props.currentUser.username}
			);

			this.setState({
				currentUserConfirmationRequest: currentUserConfirmationRequest,
				approveNote: currentUserConfirmationRequest && currentUserConfirmationRequest.note
					? currentUserConfirmationRequest.note
					: '',
				denyReason: currentUserConfirmationRequest && currentUserConfirmationRequest.reason
					? currentUserConfirmationRequest.reason
					: ''
			});
		}
	}

	render(){
		if(!this.props.request){
			return (
				<p>
					It looks like you're not allowed to view this request.
				</p>
			);
		}

		let requestResponseNode;
		let adminControls = [];
		if(this.props.currentUser && this.props.currentUser.role === 'admin'
				&& this.props.request.status === 'pending'){
			if(this.isRequest()){
				adminControls.push(
					<button type="button" className="btn btn-warning"
							key="resend-confirmation-requests-button"
							onClick={this.handleOpenResendConfirmationRequestsPanel}>
						Resend confirmation requests
					</button>
				);

				if(this.state.showResendConfirmationRequestsPanel){
					let confirmationRequestGroups = [];
					for(let confirmationRequest of this.props.request.confirmationRequests){
						if(confirmationRequest.status === 'pending'){
							confirmationRequestGroups.push(
								<div key={confirmationRequest.confirmer} className="form-group">
									<label>
										<input type="checkbox"
											value={confirmationRequest.confirmer}
											checked={
												this.state.resendUsernames
												.includes(confirmationRequest.confirmer)
											}
											onChange={this.handleChangeResendUsernames} />
										{displayNameByUsername(confirmationRequest.confirmer)}
									</label>
								</div>
							);
						}
					}

					adminControls.push(
						<div className="panel panel-default resend-confirmation-requests-container"
								key="resend-confirmation-requests-container">
							<div className="panel-heading">
								<span className="panel-title">
									Resend confirmation requests
									<button type="button" className="close"
											aria-label="Close"
											onClick={this.handleCloseResendConfirmationRequestsPanel}>
										<span aria-hidden="true">&times;</span>
									</button>
								</span>
							</div>
							<div className="panel-body">
								<form onSubmit={this.handleSubmitResendConfirmationRequests}>
									{confirmationRequestGroups}
									<button type="submit" className="btn btn-warning">
										Resend requests
									</button>
								</form>
							</div>
						</div>
					);
				}
			}
		}

		if(this.state.currentUserConfirmationRequest){
			if(this.state.currentUserConfirmationRequest.status === 'pending'
					&& this.props.request.status === 'pending'){
				requestResponseNode = (
					<div className="request-response-container well">
						<div className="row">
							<form className="col-md-5" onSubmit={this.handleApprovalSubmit}>
								<label htmlFor="approve-note">Note (optional)</label>
								<textarea id="approve-note" className="form-control"
									value={this.state.approveNote}
									onInput={this.handleApproveNoteInput}></textarea>
								<button type="submit" className="btn btn-lg btn-primary">
									Approve request
								</button>
							</form>

							<form className="col-md-5 col-md-offset-2" onSubmit={this.handleDenialSubmit}>
								<label htmlFor="deny-reason">Reason for denial</label>
								<textarea id="deny-reason" className="form-control"
									value={this.state.denyReason}
									onInput={this.handleDenyReasonInput}></textarea>
								<button type="submit" className="btn btn-lg btn-primary">
									Deny request
								</button>
							</form>
						</div>
					</div>
				);
			}
			else if(this.props.request.status === 'pending'){
				requestResponseNode = (
					<div className="request-response-container well">
						<p>
							You have already submitted a response to this request.
						</p>
			{
				this.state.currentUserConfirmationRequest.status === 'approved'
					? (
						<form onSubmit={this.handleEditApprovalNoteSubmit}>
							<label htmlFor="edit-approve-note">Edit approval note</label>
							<textarea id="edit-approve-note" className="form-control"
								value={this.state.approveNote}
								onInput={this.handleApproveNoteInput}></textarea>
							<button type="submit" className="btn btn-lg btn-primary">
								Approve request
							</button>
						</form>
					)
					: null
			}
					</div>
				);
			}
		}

		let additionalFellowshipInfoPanel;
		if(this.props.request.additionalFellowshipInfo){
			let additionalFellowshipInfoRows = [];
			for(let key in this.props.request.additionalFellowshipInfo){
				let additionalInfo = this.props.request.additionalFellowshipInfo[key];
				if(typeof additionalInfo === 'boolean')
					additionalInfo = additionalInfo ? 'yes' : 'no';
				additionalInfo = capitalizeFirstLetter(additionalInfo);

				additionalFellowshipInfoRows.push(
					<tr key={key}>
						<th>{camelCaseToWords(key)}</th>
						<td>{additionalInfo}</td>
					</tr>
				);
			}

			additionalFellowshipInfoPanel = (
				<div className="panel panel-default">
					<div className="panel-heading">
						Additional info
					</div>
					<table className="table table-striped">
						<tbody>
							{additionalFellowshipInfoRows}
						</tbody>
					</table>
				</div>
			);
		}

		let requestorControls;
		if(window.location.pathname.startsWith(`/request/${this.props.request._id}`)
				&& !Meteor.user() && ['pending', 'approved'].includes(this.props.request.status)){
			requestorControls = (
				<div className="well">
					<div className="row">
						<div className="col-md-12">
							<div className="form-group">
								<label htmlFor="cancel-reason">Cancel request</label>
								<textarea className="form-control" id="cancel-reason"
										value={this.state.cancelReason}
										onInput={this.handleCancelReasonInput}></textarea>
							</div>
							<button type="button" className="btn btn-danger"
									onClick={this.handleCancelRequestClick}>
								Cancel request
							</button>
						</div>
					</div>
				</div>
			);
		}

		return (
			<div>

	{
		this.state.error
			? (
				<ErrorAlert onClose={this.handleErrorClose}>
					{this.state.error}
				</ErrorAlert>
			)
			: null
	}

				<h1>
					{this.props.request.requestorName + ' '}
					<span className={`label request-type ${this.props.request.dayOffType}`}>
						{DAY_OFF_TYPE_NAMES[this.props.request[DAY_OFF_FIELDS.TYPE]]}
					</span>
				</h1>

				<div className="row">
					<RequestDetailsMain request={this.props.request} />
					<RequestDetailsAside request={this.props.request}
						currentUser={this.props.currentUser}
						scheduleReminder={this.scheduleReminder} />
				</div>

	{
		requestResponseNode
			? (
				<div className="row">
					<div className="col-md-10 col-md-offset-1">
						{requestResponseNode}
					</div>
				</div>
			)
			: null
	}
				{additionalFellowshipInfoPanel}
				{requestorControls}
				{adminControls}
			</div>
		);
	}

	isRequest(){
		return (this.props.request[DAY_OFF_FIELDS.TYPE] !== DAY_OFF_TYPES.SICK);
	}

	scheduleReminder(event){
		const button = event.target;
		const username = button.dataset.username;
		const user = Meteor.users.findOne({ username: username });

		let remindTime = moment(this.props.request.requestedDate[0])
			.subtract(DAYS_BEFORE_REQUEST_TO_SEND_REMINDER, 'days')
			.startOf('day');

		Meteor.call('reminderEmails.scheduleReminder', this.props.request, user, remindTime.toDate(), (err) => {
			if(err){
				console.log(err.name, err.message);
				this.setError('There was a problem scheduling the reminder.');
				throwError(err.message);
			}
		});
	}

	handleApproveNoteInput(event){
		this.setState({approveNote: event.target.value});
	}

	handleDenyReasonInput(event){
		this.setState({denyReason: event.target.value});
	}

	handleApprovalSubmit(event){
		event.preventDefault();
		const requestId = this.props.request._id;
		const note = this.state.approveNote;
		Meteor.call('dayOffRequests.approveRequest', requestId, note, err => {
			if(err){
				console.log(`${err.name}: ${err.message}`);
				this.setError('There was a problem approving the request.');
				throwError(err.message);
			}
		});
	}

	handleDenialSubmit(event){
		event.preventDefault();
		if(!this.state.denyReason){
			this.setState({error: 'Please enter a reason why you are denying the request.'});
			return;
		}
		const requestId = this.props.request._id;
		const reason = this.state.denyReason;

		Meteor.call('dayOffRequests.denyRequest', requestId, reason, err => {
			if(err){
				console.log(`${err.name}: ${err.message}`);
				this.setError('There was a problem denying the request.');
				throwError(err.message);
			}
		});
	}

	handleEditApprovalNoteSubmit(event){
		event.preventDefault();
		const requestId = this.props.request._id;
		const note = this.state.approveNote;
		Meteor.call('dayOffRequests.editApprovalNote', requestId, note, err => {
			if(err){
				console.log(`${err.name}: ${err.message}`);
				this.setError('There was a problem editing the approval note.');
				throwError(err.message);
			}
		});
	}

	handleOpenResendConfirmationRequestsPanel(){
		this.setState({showResendConfirmationRequestsPanel: true});
	}

	handleCloseResendConfirmationRequestsPanel(){
		this.setState({showResendConfirmationRequestsPanel: false});
	}

	handleChangeResendUsernames(event){
		this.setState(previousState => {
			let resendUsernames = previousState.resendUsernames.slice();
			if(event.target.checked){
				if(!resendUsernames[event.target.value])
					resendUsernames.push(event.target.value);
			}
			else {
				if(resendUsernames[event.target.value])
					resendUsernames.splice(
						resendUsernames.indexOf(event.target.value),
						1
					);
			}

			return {
				resendUsernames: resendUsernames
			};
		});
	}

	handleSubmitResendConfirmationRequests(event){
		event.preventDefault();
		const requestId = this.props.request._id;
		const resendUsernames = this.state.resendUsernames;
		if(resendUsernames && resendUsernames.length > 0){
			Meteor.call('dayOffRequests.resendConfirmationRequests', requestId, resendUsernames, err => {
				if(err){
					console.log(`${err.name}: ${err.message}`);
					this.setError('There was a problem sending the requests');
					throwError(err);
				}
				else {
					this.handleCloseResendConfirmationRequestsPanel();
				}
			});
		}
	}

	handleCancelReasonInput(event){
		this.setState({cancelReason: event.target.value});
	}

	handleCancelRequestClick(){
		const requestId = this.props.request._id;
		const cancelReason = this.state.cancelReason;
		if(cancelReason){
			Meteor.call('dayOffRequests.cancelRequest', requestId, cancelReason, err => {
				if(err){
					console.log(`${err.name}: ${err.message}`);
					this.setError('There was a problem cancelling the request');
					throwError(err);
				}
			});
		}
	}

	setError(error){
		error = escapeNewlines`${error}
			Please refresh the page and try again. If this problem continues,
			please let me know at ${ADMIN_EMAIL_ADDRESS}.`;
		this.setState({error: error});
	}

	handleErrorClose(){
		this.setState({error: ''});
	}
}

RequestDetails.propTypes = {
	request: PropTypes.object,
	currentUser: PropTypes.object
};
