/* @flow */

import React, { Component } from 'react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';

import ManageRequest from '../ManageRequest.js';

import {
	DAY_OFF_FIELD_NAMES,
	DAY_OFF_TYPES,
	DAY_OFF_TYPE_NAMES,
	RESIDENT_DAY_OFF_TYPES
} from '../../../constants.js';

import type { Node, SyntheticEvent } from 'react';

import type { User } from '../../../api/users.js';
import type { Location } from '../../../api/locations.js';
import type { ResidentRequestFields } from '../../../types.js';

type Props = {
	currentUser: User,
	locations: Array<Location>,
	chiefs: Array<User>
};

type State = ResidentRequestFields & {
	dateRange: boolean,
	completedFields: Set<string>,
	submitted: boolean
};

const fields = [
	'dayOffType',
	'requestorName',
	'requestorEmail',
	'requestedDate',
	'requestedLocation',
	'requestReason'
];

export default class ResidentRequest extends Component<Props, State> {
	constructor() {
		super();

		this.state = {
			completedFields: new Set(),
			dateRange: false,
			submitted: false,

			dayOffType: '',
			requestorName: '',
			requestorEmail: '',
			requestedDate: '',
			requestedLocation: '',
			requestReason: ''
		};
	}

	render() {
		const { submitted, dayOffType } = this.state;
		const nextField = this.nextField();

		return (
			<section className={`home ${dayOffType} resident`}>
			{ submitted
				? this.submissionConfirmation()
				: (
					<>
						{this.completedEntries()}
						{ nextField
							? this.entryForm(nextField)
							: this.requestConfirmation()
						}
					</>
				)
			}
			</section>
		);
	}

	completedEntries = (): Node => {

		const trs = fields.filter(field =>
			this.state[field]
		).map(field =>
			<tr key={field}
				className="completed-entry"
				onClick={() => {
					this.setState(state => ({
						completedFields: new Set(...state.completedFields
							.filter(completedField =>
								completedField !== field
							))
					}));
				}}>

				<th>{DAY_OFF_FIELD_NAMES[field]}</th>
				<td>{this.state[field]}</td>
			</tr>
		);

		return (
			<section className="completed-entries">
				<table>
					{trs}
				</table>
			</section>
		);
	}

	nextField = (): ?string => {
		const { completedFields } = this.state;
		return fields.find(field => !completedFields.includes(field));
	}

	entryForm = (nextField = this.nextField()): ?Node => (
		nextField && this[nextField] && (
			<form className="entry-form" onSubmit={this.handleEntryFormSubmit}>
				{this[nextField]()}
				<button type="submit" className="btn btn-lg btn-primary">
					Next
				</button>
			</form>
		)
	)

	handleEntryFormSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
		event.preventDefault();

		this.setState(state => {
			const completedFields = new Set(state.completedFields);

			const data = new FormData(event.target);

			for (const name of data.keys()) {
				if (fields.includes(name)) {
					completedFields.add(name);
				}
			}

			return {
				completedFields
			};
		});
	}

	dayOffType = (): Node => {
		const buttons = RESIDENT_DAY_OFF_TYPES.map(type => ({
			value: type,
			text: DAY_OFF_TYPE_NAMES[type]
		})).map(({value, text}) =>
			<button key={value} type="submit"
					className={`day-off-button btn btn-lg btn-primary ${value}`}
					name="dayOffType"
					value={value}>
				{text}
			</button>
		);

		return (
			<div>
				<section className="day-off-buttons">
					{buttons}
				</section>
				<ManageRequest />
			</div>
		);
	}

	requestorName = (): Node => (
		<div className="labelled-input">
			<label htmlFor="name">Your name</label>
			<input type="text"
				className="requestorName"
				id="name"
				placeholder="Your name"
				value={this.state.requestorName}
				onInput={event => {this.setState({requestorName: event.target.value});}}
				autoComplete="off"
				autoFocus={true}
				required />
		</div>
	)

	requestorEmail = (): Node => (
		<div className="labelled-input">
			<label htmlFor="email">Your email</label>
			<input type="email"
				id="email"
				name="requestorEmail"
				placeholder="Your email"
				value={this.state.requestorEmail}
				onInput={event => {this.setState({requestorEmail: event.target.value});}}
				autoComplete="off"
				autoFocus={true}
				required />
		</div>
	)

	requestedDate = (): Node => {
		const { dateRange, requestedDate } = this.state;
		const flatpickrOptions = {
			altInput: true,
			mode: dateRange ? 'single' : 'range'
		};

		return (
			<div>
				<label>
					Date
					<Flatpickr options={flatpickrOptions}
						value={requestedDate}
						onChange={requestedDate => {this.setState({requestedDate});}} />
				</label>
				<label id="multiple-days-label">
					Multiple days?
					<input type="checkbox"
						id="multiple-days"
						checked={dateRange}
						onChange={event => {this.setState({dateRange: event.target.checked});}} />
				</label>
			</div>
		);
	}

	requestedLocation = (): Node => (
		<select name="requestedLocation" required
				onChange={event => {this.setState({requestedLocation: event.target.value});}}>
			<option value="">Select location</option>
		{this.props.locations.map(location => (
			<option key={location._id} value={location}>
				{location.name}
			</option>
		))}
		</select>
	)

	requestReason = (): Node => (
		<textarea className="form-control"
			name="requestReason"
			placeholder="Reason (optional)"
			value={this.state.requestReason}
			onInput={event => {this.setState({requestReason: event.target.value});}}
			autoComplete="off"
			autoFocus={true}>
		</textarea>
	)

	requestConfirmation = (): Node => (
		<div className="request-confirmation">
			<input type="hidden" name="requestConfirmation" value="confirmed" />
			<p>
				Does everything look right? Click an entry to change it.
			</p>
		</div>
	)

	submissionConfirmation = (): Node => {
		const { locations, chiefs } = this.props;
		const { dayOffType, requestedLocation } = this.state;
		const location = locations.find(location =>
			location._id === requestedLocation
		);

		return (
			<div className="submission-confirmation-container">
				<div className="submission-confirmation">
		{
			dayOffType === DAY_OFF_TYPES.SICK
				? (
					<>
						<p>
							Please notifcy your rotation site charge faculty
							and the faculty you are assigned directly as soon
							as possible
						</p>
				{
					location && location.number && (
						<p className="location-number">
							{location.name}: {location.number}
						</p>
					)
				}
						<p>
							If you are on call, notify both chief residents via
							pager as soon as possible.
						</p>
						<table className="chief-pager-table">
						{chiefs.map(chief =>
							<tr key={chief._id}>
								<th>{chief.name}</th>
								<td>{chief.pager}</td>
							</tr>
						)}
						</table>
					</>
				)
				: (
					<p>
						Approval requests have been sent.
						You will be notified of their responses.
					</p>
				)
		}
					<button type="button" className="btn btn-lg btn-primary"
							onClick={this.clearResponses}>
						Restart
					</button>
				</div>
			</div>
		);
	}

	clearResponses = () => {
		// TODO
	}
}
