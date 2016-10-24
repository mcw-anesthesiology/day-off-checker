import React from 'react';
import { Meteor } from 'meteor/meteor';

import { DayOffRequests } from '../../api/day-off-requests.js';

export default class ManageRequest extends React.Component {
	constructor(){
		super();
		this.state = {
			requestId: '',
			error: ''
		};

		this.handleRequestInput = this.handleRequestInput.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	render(){
		return (
			<div>
				<input type="text" className="form-control"
					value={this.state.requestId}
					onInput={this.handleRequestInput} />
				<button type="button" className="btn btn-primary"
						onClick={this.handleSubmit}>
					Submit
				</button>
			</div>
		);
	}

	handleRequestInput(event){
		this.setState({requestId: event.target.value});
	}

	handleSubmit(){
		if(this.state.requestId){
			Meteor.subscribe('dayOffRequests_byId', this.state.requestId,
				() => {
					const request = DayOffRequests.findOne(this.state.requestId);
					console.log(request);
					if(request){
						window.location = `/request/${this.state.requestId}`;
					}
				}
			);
		}
	}
}
