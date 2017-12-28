/* @flow */

import React, { Component } from 'react';

import ResidentRequest from '../../containers/Home/ResidentRequestContainer';

export default class Home extends Component<{}, {}> {
	render() {

		const request = <ResidentRequest />;

		return (
			<div>
				{request}
			</div>
		);
	}
}
