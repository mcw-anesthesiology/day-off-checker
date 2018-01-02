import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactTable from 'react-table';
import moment from 'moment';
import 'twix';

import 'react-table/react-table.css';

import RequestDetails from './RequestDetails.js';

import {
	displayDate,
	displayDateRange,
	matchesSearch,
	statusLabelType,
	ucfirst
} from '../../utils.js';

export default class RequestsStatsTable extends Component {
	render() {
		const {search, dayOffRequests, currentUser} = this.props;
		const requestors = new Map();

		dayOffRequests.map(request => {
			if(search && !matchesSearch(request, search))
				return;

			let row = requestors.get(request.requestorEmail) || {};
			if (!row.name)
				row.name = request.requestorName;
			if (!row.email)
				row.email = request.requestorEmail;
			if (!row.requests)
				row.requests = [];

			row.requests.push(request);

			if (request.dayOffType === 'sick' || request.status === 'approved') {
				let daysOff = moment(request.requestedDate[0])
					.twix(request.requestedDate[1], true).length('days', true);

				if (!('totalDays' in row))
					row.totalDays = 0;

				row.totalDays += daysOff;

				let dayOffType = (request.dayOffType === 'sick')
					? 'sickDays'
					: 'approvedDays';

				if (!(dayOffType in row))
					row[dayOffType] = 0;

				row[dayOffType] += daysOff;
			}

			requestors.set(request.requestorEmail, row);
		});
		let rows = Array.from(requestors.values());

		const columns = [
			{
				Header: 'Name',
				accessor: 'name'
			},
			{
				Header: 'Email',
				accessor: 'email'
			},
			{
				Header: 'Total days off',
				accessor: 'totalDays'
			},
			{
				Header: 'Approved days',
				accessor: 'approvedDays'
			},
			{
				Header: 'Sick days',
				accessor: 'sickDays'
			},
			{
				Header: 'Pending requests',
				id: 'pendingRequests',
				accessor: row =>
					row.requests.filter(request =>
						request.status === 'pending'
						&& request.dayOffType !== 'sick'
					).length
			}
		];

		return (
			<ReactTable className="stats-table"
				data={rows}
				columns={columns}
				SubComponent={({row, original}) => (
					<div className="stats-requests-sub-component">
						<div className="panel panel-default">
							<div className="panel-heading">
								Days off — {row.name}
							</div>
							<div className="panel-body">
								{console.log(original)}
								<ReactTable className="requests-table"
									data={original.requests}
									columns={[
										{
											Header: 'Location',
											id: 'location',
											accessor: request =>
												request.requestedLocation.name
										},
										{
											Header: 'Dates',
											id: 'dates',
											accessor: request =>
												request.requestedDate[0],
											Cell: ({row}) =>
												displayDateRange(row.requestedDate),
											minWidth: 75
										},
										{
											Header: 'Submitted',
											accessor: 'requestTime',
											Cell: ({value}) =>
												displayDate(value)
										},
										{
											Header: 'Reason',
											accessor: 'requestReason',
											minWidth: 200
										},
										{
											Header: 'Status',
											id: 'status',
											Cell: ({original}) =>
												<span className={`label ${statusLabelType(original.status)}`}>
												{
													original.dayOffType === 'sick'
														? 'Sick day'
														: ucfirst(original.status)
												}
												</span>
										}
									]}
									SubComponent={({original}) =>
										<section className="request-details well well-lg">
											<RequestDetails
												request={original}
												currentUser={currentUser} />
										</section>
									}
									collapseOnDataChange={false}
									pageSize={original.requests.length}
									showPagination={false} />
							</div>
						</div>
					</div>
				)}
				collapseOnDataChange={false}
				pageSize={rows.length}
				showPagination={false} />
		);
	}
}

RequestsStatsTable.propTypes = {
	search: PropTypes.string,
	dates: PropTypes.array,
	currentUser: PropTypes.object,
	dayOffRequests: PropTypes.array.isRequired
};
