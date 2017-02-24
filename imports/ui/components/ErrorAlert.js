import React, { PropTypes } from 'react';

const ErrorAlert = props => (
	<div className="container">
		<div className="alert alert-danger alert-dismissable error-alert" role="alert">
			<button type="button" className="close" aria-label="Close"
					onClick={props.onClose}>
				<span aria-hidden="true">&times;</span>
			</button>
			{props.children}
		</div>
	</div>
);

export default ErrorAlert;

ErrorAlert.propTypes = {
	children: PropTypes.node,
	onClose: PropTypes.func
};
