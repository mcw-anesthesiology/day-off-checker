import React from 'react';

export default function ErrorAlert(props){
	return (
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
}

ErrorAlert.propTypes = {
	children: React.PropTypes.node,
	onClose: React.PropTypes.func
};
