import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class EditLocation extends Component {
	constructor(props){
		super(props);
		this.state = {
			_id: props.location._id,
			name: props.location.name,
			number: props.location.number,
			administrator: props.location.administrator
		};

		this.handleIdInput = this.handleIdInput.bind(this);
		this.handleNameInput = this.handleNameInput.bind(this);
		this.handleNumberInput = this.handleNumberInput.bind(this);
		this.handleAdminChange = this.handleAdminChange.bind(this);
		this.handleFormSubmit = this.handleFormSubmit.bind(this);
		this.handleCancelPress = this.handleCancelPress.bind(this);
	}

	render(){
		let siteAdminOptions = [];
		for(let admin of this.props.siteAdmins){
			siteAdminOptions.push(<option key={admin.username} value={admin.username}>{admin.name}</option>);
		}

		return (
			<div className="well">
				<h2>Edit location</h2>
				<form id="edit-location" onSubmit={this.handleFormSubmit}>
					<div className="row">
						<div className="form-group col-lg-3">
							<label htmlFor="id">ID</label>
							<input type="text" className="form-control" id="id"
								name="_id" value={this.state._id} placeholder="ID"
								required onInput={this.handleIdInput}
								/>
						</div>
						<div className="form-group col-lg-3">
							<label htmlFor="name">Name</label>
							<input type="text" className="form-control" id="name"
								name="name" value={this.state.name} placeholder="Name"
								required onInput={this.handleNameInput}
								/>
						</div>
						<div className="form-group col-lg-3">
							<label htmlFor="number">Number</label>
							<input type="text" className="form-control" id="number"
								name="number" value={this.state.number} placeholder="Number"
								required onInput={this.handleNumberInput}
								/>
						</div>
						<div className="form-group col-lg-3">
							<label htmlFor="administrator">Administrator</label>
							<select value={this.state.administrator} className="form-control"
									id="administrator" name="administrator" required
									onChange={this.handleAdminChange}
									>
								<option value="">Select an administrator</option>
								{siteAdminOptions}
							</select>
						</div>
					</div>
					<div className="row button-row">
						<button type="button" className="btn btn-default" onClick={this.handleCancelPress}>Cancel</button>
						<button type="submit" className="btn btn-primary">Submit</button>
					</div>
				</form>
			</div>
		);
	}

	handleIdInput(event){
		this.setState({'_id': event.target.value});
	}

	handleNameInput(event){
		this.setState({'name': event.target.value});
	}

	handleNumberInput(event){
		this.setState({'number': event.target.value});
	}

	handleAdminChange(event){
		this.setState({'administrator': event.target.value});
	}

	handleFormSubmit(event){
		event.preventDefault();
		this.props.handleSubmit({
			_id: this.state._id,
			fellowship: this.props.fellowshipId,
			name: this.state.name,
			number: this.state.number,
			administrator: this.state.administrator
		});
	}

	handleCancelPress(){
		this.props.handleCancel();
	}
}

EditLocation.propTypes = {
	fellowshipId: PropTypes.string,
	location: PropTypes.object,
	siteAdmins: PropTypes.array,
	handleSubmit: PropTypes.func,
	handleCancel: PropTypes.func
};
