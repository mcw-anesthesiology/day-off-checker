import React from 'react';

export default function ErrorAlert(props){
	return (
		<div className="container">
			<div className="alert alert-danger alert-dismissable error-alert" role="alert">
				<button type="button" className="close" data-dismiss="alert"
						aria-label="Close" onClick={this.onClose}>
					<span aria-hidden="true">&times;</span>
				</button>
				<strong>Error:</strong>
				{props.children}
			</div>
		</div>
	);
}

ErrorAlert.propTypes = {
	children: React.PropTypes.node,
	onClose: React.PropTypes.func
};
