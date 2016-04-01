import { Locations } from '../../api/locations.js';
import { DayOffRequests } from '../../api/day-off-requests.js';

Migrations.add({
	version: 1,
	up() {
		const locations = [
			{
				_id: "froedtert",
				name: "Froedtert",
				number: "123-456-7890"
			},
			{
				_id: "childrens",
				name: "Children's Hospital",
				number: "325-234-2634"
			},
			{
				_id: "va",
				name: "VA",
				number: "114-143-5135"
			}
		];

		for(let location of locations){
			Locations.insert(location);
		}
	},
	down(){
		Locations.remove({});
	}
});
