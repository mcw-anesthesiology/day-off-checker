import React from 'react';

import {
	displayDate,
	displayDateRange
} from '../../utils.js';

export default function RequestDetailsMain(props){
	return (
		<div className="col-md-9 request-details-main">
			<div className="row date-location-container">
				<div className="col-md-5">
					<span className="request-date">
						{displayDateRange(props.request.requestedDate)}
					</span>
				</div>
				<div className="col-md-5 col-md-offset-2">
					<span className="request-location">
						{props.request.requestedLocation.name}
					</span>
				</div>
			</div>
{
	props.request.requestReason
		? (
			<div className="row request-reason">
				<div className="col-md-10 col-md-offset-1">
					<p>{props.request.requestReason}</p>
				</div>
			</div>
		)
		: null
}

			<div className="row id-time-container">
				<div className="col-md-5">
					<span className="request-id">
						<b>ID: </b>
						{props.request._id}
					</span>
				</div>
				<div className="col-md-5 col-md-offset-2">
					<span className="request-time">
						<b>Requested: </b>
						<time dateTime={props.request.requestTime.toISOString()}>
							{displayDate(props.request.requestTime)}
						</time>
					</span>
				</div>
			</div>
		</div>
	);
}

RequestDetailsMain.propTypes = {
	request: React.PropTypes.object.isRequired
};
