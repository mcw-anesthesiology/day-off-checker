/* @flow */

export type DateLike = Date | string;

export type ResidentRequestFields = {
	dayOffType: string,
	requestorName: string,
	requestorEmail: string,
	requestedDate: DateLike,
	requestedLocation: string,
	requestReason: ?string
};
