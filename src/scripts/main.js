/**
 * @file main.js
 * @author Mihai Peteu <mihai.peteu@gmail.com>
 * @copyright 2016 Middle of June.  All rights reserved.
 */

//
// Methods outside of document.ready
//

/**
 * lookupArtist(event)
 * Old school HTML onclick call generated by Events list
 * Needs to be outside document.ready or it'll throw undefined error
 * @param {array} event Object containing all of the related show info
 */
function lookupArtist(event) {
    // Pop up hidden modal
    $('#artistModal').modal('show');

    // Delay Promise chain until dialog is popped open!
    // Clear existing modal content 
    $('#artist-event').empty();
    $('.modal-title').html(); 

    var showTitle = event.artist;

    // Load artist/show data differently based on source
    switch(event.source) {
        case 'scenestar':
            startPromiseChain(event);
            break;
        case 'experiencela':
            showTitle = event.title;
            Events.displayStaticShowInfo('artist-info', event);
            break;
        default:
            // default code 
    }// End switch based on event Source


      // Append venue name + link
    $('#artist-event').html(
        'Go see ' + showTitle + ' at ' + '<a href="' + event.url + '" class="link">' 
        + event.venue + ' <i class="fa fa-music"></i></a>');
    $('.modal-title').html(event.artist + ' / ' + event.venue + ' / ' + event.nice_date);

}// End lookupArtist


/**
 * startPromiseChain(event)
 * Events / Artist info promise chain
 * @param {array} event Object containing all of the related show info
 */
function startPromiseChain(event) {
    // returns $.ajax from Last.fm API
    Events.getArtistInfo(event.artist)
        .then(function(artistData) {
            // returns artist name, used in the next .then
            return Events.appendArtistInfo('artist-info', artistData);
        })
        .then(function(artistName) {      
            // returns $.ajax from Youtube API
            return Events.getTopTracks(artistName);
        })
        .then(function(trackData) {
            Events.appendTopTracks('artist-tracks', trackData);
        });
}// End startPromiseChain

//
// Methods registered after document.ready
//
$(document).ready(function() {
    // Asynchronously load modal template
    $.get('templates/artist-modal.html', function(template) {
        // Inject all those templates at the end of the document.
        $('body').append(template);
    });

    //
    // LISTENERS
    //
    $('#eml-blk').click(function() {
        var emailaddy = rvStr($("#eml").data("u")) + '@' + rvStr($("#eml").data("d"));
        document.location.href = 'ma' + 'il' + 'to' + ':' + emailaddy;
    });

    $('#gPlusLogin').click(function() {
        var ref = new Firebase("https://blinding-torch-6251.firebaseio.com");
        ref.onAuth(function(authData) {
            if (authData !== null) {
                console.log("Login Success!", authData);
                window.authData = authData;
            } 
            else {
                ref.authWithOAuthRedirect("google", function(error, authData) {
                    if (error) {
                        console.log("Problems Houston...", error);
                    }
                });// End authWithOAuthRedirect
            }// End else
        })// End ref.onAuth
    });

    $('#getPosition').click(function() {
        // Get venues within 25 miles, max 10 results
        getPosition();
    });

    // Get events data ajax call, push to DOM
    $('#getEvents').click(function() {
    // 
    });// End getEvents

    $('#getNearbyVenues').click(function() {
    // Get venues within 25 miles, max 10 results
    getNearbyVenues(25, 4);
    });

    $('#setPageState').click(function() {
    // Parse the hashtag section from URL
    var lastSection = window.location.href.split("/").pop();

    // Save the last visited page
    setPageState(lastSection);
    });


    // 
    // Get list of shows, display them, set click listeners on each Artist
    //
    Events.getEvents(10)
        // Return events $.ajax request
        .then(function(data) {
            // Parse the data into JSON object
            var eventData = JSON.parse(data);

            // Save data to local storage
            UserState.events = eventData.events;

            // JSON data will go into shows-content div
            Events.displayEvents(eventData, 'shows-content');
        })
        // Add old school click listener on parent div (will bubble up)
        .then(function(){  
            // https://davidwalsh.name/event-delegate
            document.getElementById('shows-content').addEventListener("click", function(e) {
                var eventid = $(e.target).data('eventid');
                var event = UserState.events[eventid];
                // Ensure that user has clicked on an actual link
                if (event !== undefined && event.hasOwnProperty('source')) {
                    lookupArtist(event);
                }
            });// End addEventListener
        });// End add old school click listener

});// End on Document Load
