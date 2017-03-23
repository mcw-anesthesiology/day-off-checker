import React, { Component, PropTypes } from 'react';
import ReactTable from 'react-table';

import 'react-table/react-table.css';

import {
	displayDate,
	displayDateRange,
	matchesSearch,
	statusLabelType,
	ucfirst
} from '../../utils.js';

export default class RequestsStatsTable extends Component {
	render(){
		const {search, dayOffRequests} = this.props;
		const requestors = new Map();

		dayOffRequests.map(request => {
			if(search && !matchesSearch(request, search))
				return;

			let row = requestors.get(request.requestorEmail) || {};
			if(!row.name)
				row.name = request.requestorName;
			if(!row.email)
				row.email = request.requestorEmail;
			if(!row.requests)
				row.requests = [];
			row.requests.push(request);
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
				header: 'Approved',
				id: 'approvedRequests',
				accessor: row =>
					row.requests.filter(request =>
						request.status === 'approved').length
			},
			{
				header: 'Denied',
				id: 'deniedRequests',
				accessor: row =>
					row.requests.filter(request =>
						request.status === 'denied').length
			},
			{
				header: 'Pending',
				id: 'pendingRequests',
				accessor: row =>
					row.requests.filter(request =>
						request.status === 'pending').length
			},
			{
				header: 'Total',
				id: 'totalRequests',
				accessor: row => row.requests.length
			}
		];

		return (
			<ReactTable className="stats-table"
				defaultPageSize={10}
				data={rows}
				columns={columns}
				SubComponent={({row}) => (
					<div className="stats-requests-sub-component">
						<div className="panel panel-default">
							<div className="panel-heading">
								Requests — {row.name}
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
											minWidth: 50
										},
										{
											header: 'Requested',
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
													ucfirst(request.status)
												}
												</span>
										}
									]}
									pageSize={row.requests.length}
									showPagination={false} />
							</div>
						</div>
					</div>
				)} />
		);
	}
}

RequestsStatsTable.propTypes = {
	search: PropTypes.string,
	dates: PropTypes.array,
	dayOffRequests: PropTypes.array
};
