import React from 'react';
import { Meteor } from 'meteor/meteor';

import { DayOffRequests } from '../../api/day-off-requests.js';

import ErrorAlert from './ErrorAlert.js';

export default class ManageRequest extends React.Component {
	constructor(){
		super();
		this.state = {
			active: false,
			requestId: '',
			error: ''
		};

		this.handleActiveClick = this.handleActiveClick.bind(this);
		this.handleCancelClick = this.handleCancelClick.bind(this);
		this.handleRequestInput = this.handleRequestInput.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleErrorClose = this.handleErrorClose.bind(this);
	}

	render(){

		if(this.state.active)
			return (
				<div className="manage-request-container">
		{
			this.state.error
				? (
					<ErrorAlert onClose={this.handleErrorClose}>
						{this.state.error}
					</ErrorAlert>
				)
				: null
		}
					<div className="form-group labelled-input">
						<label htmlFor="manage-request-id">Request ID</label>
						<input type="text" id="manage-request-id"
							placeholder="Request ID"
							value={this.state.requestId}
							onInput={this.handleRequestInput} />
					</div>
					<div className="form-group text-center">
						<button type="button" className="btn btn-primary"
								onClick={this.handleSubmit}>
							Submit
						</button>
						<button type="button" className="btn btn-default"
								onClick={this.handleCancelClick}>
							Cancel
						</button>
					</div>
				</div>
			);

		else
			return (
				<a href="#" onClick={this.handleActiveClick}>
					Manage an existing request
				</a>
			);
	}

	handleActiveClick(event){
		event.preventDefault();
		this.setState({active: true});
	}

	handleCancelClick(){
		this.setState({active: false});
	}

	handleRequestInput(event){
		this.setState({requestId: event.target.value});
	}

	handleSubmit(){
		if(this.state.requestId){
			Meteor.subscribe('dayOffRequests_byId', this.state.requestId,
				() => {
					const request = DayOffRequests.findOne(this.state.requestId);
					if(request)
						window.location = `/request/${this.state.requestId}`;
					else
						this.setState({error: 'Sorry, unable to find request with that ID'});
				}
			);
		}
	}

	handleErrorClose(){
		this.setState({error: ''});
	}
}
