import React, { Component } from 'react';
import Flatpickr from 'react-flatpickr';

import 'flatpickr/dist/flatpickr.css';

import moment from 'moment';

import RequestsStatsTableContainer from '../containers/RequestsStatsTableContainer.js';

import { isValidDateRange } from '../../utils.js';

export default class RequestsStats extends Component {
	constructor(){
		super();
		this.state = {
			dates: [
				moment().startOf('month').subtract(2, 'months').toDate(),
				moment().endOf('month').startOf('day').toDate()
			],
			requestDates: [
				moment().startOf('month').subtract(2, 'months').toDate(),
				moment().endOf('month').startOf('day').toDate()
			],
			search: ''
		};

		this.onSearchInput = this.onSearchInput.bind(this);
		this.onDatesChange = this.onDatesChange.bind(this);
		this.clearDates = this.clearDates.bind(this);
		this.onRequestDatesChange = this.onRequestDatesChange.bind(this);
		this.clearRequestDates = this.clearRequestDates.bind(this);
	}

	render(){
		const {search, dates, requestDates} = this.state;

		return (
			<div className="container requests-stats">
				<div className="row">
					<div className="col-sm-4 col-md-3">
						<div className="form-group">
							<label className="containing-label">
								Day off range
								<div className="input-group">
									<Flatpickr className="form-control appear-not-readonly"
										placeholder="Date range"
										value={dates}
										options={{
											mode: 'range'
										}}
										onChange={this.onDatesChange} />
									<span className="input-group-btn">
										<button className="btn btn-default"
												onClick={this.clearDates}>
											Clear
										</button>
									</span>
								</div>
							</label>
						</div>
					</div>
					<div className="col-sm-4 col-md-3">
						<div className="form-group">
							<label className="containing-label">
								Request range
								<div className="input-group">
									<Flatpickr className="form-control appear-not-readonly"
										placeholder="Date range"
										value={requestDates}
										options={{
											mode: 'range'
										}}
										onChange={this.onRequestDatesChange} />
									<span className="input-group-btn">
										<button className="btn btn-default"
												onClick={this.clearRequestDates}>
											Clear
										</button>
									</span>
								</div>
							</label>
						</div>
					</div>
					<div className="col-sm-3 col-sm-offset-1 col-md-offset-3">
						<div className="form-group">
							<label className="containing-label">
								Search
								<input type="search" className="form-control"
									placeholder="Search"
									value={search}
									onInput={this.onSearchInput} />
							</label>
						</div>
					</div>
				</div>
				<RequestsStatsTableContainer search={search}
					dates={dates} requestDates={requestDates} />
			</div>
		);
	}

	onSearchInput(event){
		event.preventDefault();
		this.setState({
			search: event.target.value
		});
	}

	onDatesChange(dates){
		if(isValidDateRange(dates))
			this.setState({dates});
	}

	clearDates(){
		this.setState({dates: null});
	}

	onRequestDatesChange(requestDates){
		if(isValidDateRange(requestDates))
			this.setState({requestDates});
	}

	clearRequestDates(){
		this.setState({requestDates: null});
	}

	componentWillUnmount(){
		window.removeEventListener('resize', this.resizeListener);
	}
}
