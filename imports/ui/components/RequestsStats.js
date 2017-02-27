import React, { Component, PropTypes } from 'react';
import { Table, Column, Cell } from 'fixed-data-table';
import Flatpickr from '@jacobmischka/react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import 'fixed-data-table/dist/fixed-data-table.css';

import debounce from 'lodash/debounce';
import fuzzysearch from 'fuzzysearch';

import { sortPropLength, sortPropIgnoreCase } from '../../utils.js';

export default class RequestsStats extends Component {
	constructor(){
		super();
		this.state = {
			width: window.innerWidth,
			dates: null,
			search: '',
			sortKey: null,
			sortDirection: null
		};

		this.resizeListener = debounce(() => {
			this.setState({
				width: window.innerWidth
			});
		}, 100);

		this.onSearchInput = this.onSearchInput.bind(this);
		this.onDatesChange = this.onDatesChange.bind(this);
		this.onSortChange = this.onSortChange.bind(this);
	}

	componentDidMount(){
		window.addEventListener('resize', this.resizeListener);
	}

	render(){
		const requestors = new Map();
		this.props.dayOffRequests.map(request => {
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
		const {search, sortKey, sortDirection} = this.state;
		if(search){
			rows = rows.filter(row =>
				fuzzysearch(search, row.name) || fuzzysearch(search, row.email));
		}

		if(sortKey && sortDirection){
			rows.sort(sortKey === 'requests'
				? sortPropLength(sortKey)
				: sortPropIgnoreCase(sortKey));
			if(sortDirection !== 'asc')
				rows.reverse();
		}

		return (
			<div>
				<input type="search" value={this.state.search}
					onInput={this.onSearchInput}/>
				<Flatpickr value={this.state.dates}
					options={{
						mode: 'range',
						onValueUpdate: this.onDatesChange
					}}
					onChange={this.onDatesChange} />
				<Table rowHeight={50}
						headerHeight={75}
						rowsCount={rows.length}
						width={this.state.width}
						maxHeight={5000}>
						<Column columnKey="name"
						width={200}
						fixed={true}
						header={
							<Header sortDirection={sortKey === 'name' ? sortDirection : null}
									onSortChange={this.onSortChange}>
								Name
							</Header>
						}
						cell={({rowIndex, columnKey, ...props}) => (
							<Cell {...props}>
								{rows[rowIndex][columnKey]}
							</Cell>
						)} />
					<Column columnKey="email"
						width={200}
						header={
							<Header sortDirection={sortKey === 'email' ? sortDirection : null}
									onSortChange={this.onSortChange}>
								Email
							</Header>
						}
						cell={({rowIndex, columnKey, ...props}) => (
							<Cell {...props}>
								{rows[rowIndex][columnKey]}
							</Cell>
						)} />
					<Column columnKey="requests"
						width={100}
						header={
							<Header sortDirection={sortKey === 'requests' ? sortDirection : null}
									onSortChange={this.onSortChange}>
								Requests
							</Header>
						}
						cell={({rowIndex, columnKey, ...props}) => (
							<Cell {...props}>
								{rows[rowIndex][columnKey].length}
							</Cell>
						)} />
				</Table>
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
		console.log(dates);
		this.setState({dates});
	}

	onSortChange(sortKey, sortDirection){
		this.setState({
			sortKey,
			sortDirection
		});
	}

	componentWillUnmount(){
		window.removeEventListener('resize', this.resizeListener);
	}
}

class Header extends Component {
	constructor(props){
		super(props);

		this.onSortChange = this.onSortChange.bind(this);
	}

	render(){
		const {children, sortDirection} = this.props;
		return (
			<Cell className="header-cell">
				<style jsx global>
				{`
					.header-cell {
						color: red;
					}
				`}
				</style>
				<a href="#" onClick={this.onSortChange}>
					{children} {
						sortDirection
							? sortDirection === 'asc'
								? '↓'
								: '↑'
							: ''
					}
				</a>
			</Cell>
		);
	}

	onSortChange(event){
		event.preventDefault();
		const {columnKey, sortDirection, onSortChange} = this.props;

		if(onSortChange)
			onSortChange(columnKey, sortDirection === 'asc' ? 'desc' : 'asc');
	}
}

Header.propTypes = {
	children: PropTypes.node,
	columnKey: PropTypes.string,
	sortDirection: PropTypes.string,
	onSortChange: PropTypes.func
};

RequestsStats.propTypes = {
	dayOffRequests: PropTypes.array
};
