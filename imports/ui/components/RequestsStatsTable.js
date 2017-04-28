import React, { Component, PropTypes } from 'react';
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
				header: 'Name',
				accessor: 'name'
			},
			{
				header: 'Email',
				accessor: 'email'
			},
			{
				header: 'Total days off',
				accessor: 'totalDays'
			},
			{
				header: 'Approved days',
				accessor: 'approvedDays'
			},
			{
				header: 'Sick days',
				accessor: 'sickDays'
			},
			{
				header: 'Pending requests',
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
				SubComponent={({row}) => (
					<div className="stats-requests-sub-component">
						<div className="panel panel-default">
							<div className="panel-heading">
								Days off — {row.name}
							</div>
							<div className="panel-body">
								<ReactTable className="requests-table"
									data={row.requests}
									columns={[
										{
											header: 'Location',
											id: 'location',
											accessor: request =>
												request.requestedLocation.name
										},
										{
											header: 'Dates',
											id: 'dates',
											accessor: request =>
												request.requestedDate[0],
											render: ({row}) =>
												displayDateRange(row.requestedDate),
											minWidth: 75
										},
										{
											header: 'Submitted',
											accessor: 'requestTime',
											render: ({value}) =>
												displayDate(value)
										},
										{
											header: 'Reason',
											accessor: 'requestReason',
											minWidth: 200
										},
										{
											header: 'Status',
											id: 'status',
											accessor: request =>
												<span className={`label ${statusLabelType(request.status)}`}>
												{
													request.dayOffType === 'sick'
														? 'Sick day'
														: ucfirst(request.status)
												}
												</span>
										}
									]}
									SubComponent={({row}) =>
										<section className="request-details well well-lg">
											<RequestDetails
												request={row}
												currentUser={currentUser} />
										</section>
									}
									collapseOnDataChange={false}
									pageSize={row.requests.length}
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
