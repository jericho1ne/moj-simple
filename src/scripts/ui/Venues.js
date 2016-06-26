/*
 * Venues.js
 *
 **/

var Venues = {
	// PROPERTIES
	// apiKey: "AIzaSyCF4m5XE3VTOUzo8b10EstraU1depENiB4",
	baseURL: 'scripts/api/getVenues.php',
	venuesList: [],

	/**
	 * getVenues
	 * list of venues
	 */
	getVenues: function(coords, maxDistance, maxResults) {
		console.log(" >> getVenues >> ");
		console.log(coords);

		// we'll need this refernce later inside the $.ajax scope
		var _this = this;

		var requestBody = {
			type: 	"GET",
			url: 	this.baseURL +
					"?lat=" + coords.lat +
					"&lon=" + coords.lon +
					"&maxResults=" + maxResults +
					"&maxDistance=" + maxDistance,
			async: false
		};// End requestBody

		$.ajax(requestBody).done(function(data, status) {
			if (status === 'success') {
				if (data) {
                    _this.venuesList = JSON.parse(data);
                    _this.displayVenues(_this.venuesList);
                    for (var i in _this.venuesList) {
			            console.log(_this.venuesList[i]);
			        }// End for loop 

					return true;
				}
			}
			else {
				alert("No data returned :(");
				return false;
			}
		});//End $.ajax
	},// End getVenues

    /**
     * displayVenues
     * show us what and where
     */
    displayVenues: function(venues) {
        venues.sort(function(a, b) {            // sort by proximity (closest first)
            return parseFloat(a.distance) - parseFloat(b.distance);
        });

        var venuesHtml = '';
        $('#' + CONTENT_DIV).empty();

        $(venues).each(function() {
            console.log(this);
             // $("a").attr("href", "http://www.google.com/")

            venueID = this.id;
            btnClass = 'btn-inactive';

            if (UserState.faveVenues.filter(function(venue) {
               console.log(" >>" + venueID);
               return venue.id == venueID;
            }).length === 1) {
               btnClass = 'btn-active';
            }

            venuesHtml =
                '<div class="row left">' +
                '<button class="' + btnClass + '" data-id="' + this.id + '">' +
                '<img src="media/svg/heart.svg" class="icon-link" alt="Save Favorite" />' +
                '</button>' +
                '<a href="#' + this.id + '">' + this.venue + '</a> • ' 
                + this.artist + ' - '
                + this.city + ' - ' + parseFloat(this.distance.toFixed(1)) + ' mi. away' +
                '</div>';
             // Incrementally append to DOM
            $('#' + CONTENT_DIV).append(venuesHtml);
        });
    },// End displayVenues


}// End object Venues
