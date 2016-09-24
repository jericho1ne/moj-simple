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
    $('.modal-title').empty();
    $('#event-tags').empty();

    var showTitle = event.artist;

    // Load artist/show data differently based on source
    switch(event.source) {
        case 'scenestar':
            startEventLookup(event);
            break;
        case 'experiencela':
            showTitle = event.title;
            // 
            // TODO:  break up displayStaticShowInfo into smaller actions 
            // (eg: getArtistPhoto), string them up as part of promise chain
            // 
            Events.displayStaticShowInfo('artist-info', event);
            Events.getShowDetails(event.event_id)
                .then(function(data) {
                    Events.appendShowDetail(data.events[0]);
                });
            break;
        case 'ticketfly':
            showTitle = event.title;
            Events.displayStaticShowInfo('artist-info', event);
            Events.getShowDetails(event.event_id)
                .then(function(data) {
                    Events.appendShowDetail(data.events[0]);
                });
            // Returns $.ajax from Youtube API
            Events.getTopTracks(event.artist)
                .then(function(trackData) {
                   Events.appendTopTracks('artist-tracks', trackData);
                });
            break;
        default:   // fallback case
            startEventLookup(event);
            break;
            // default code 
    }// End switch based on event Source

    // Append venue name + link to modal
    $('#tix-show-title').html(showTitle);
    $('#tix-url').html(
        '<a href="' + event.url + '">' 
        +  '<img src="media/svg/ticket.svg" class="icon-link icon-round border-mid-gray margin-right-10" alt="Get tickets" title="Get tickets"/>'
        +'</a>');
    $('#tix-url-source').html(parseUrlDomain(event.url, "short"));

    // Append Event Tags
    var tags = event.type.split(',');

    // Strip whitespace, format, save to Tags array
    for (var i = 0; i < tags.length; i++) {
        $tag = $('<div>')
            .addClass('event-tag')
            .html($.trim(tags[i]).ucwords());

        $('#event-tags').append($tag);
    }// End event tag loop

    // Create event url share link
    var shareLink = buildSharingLink(event.slug);
    $('#share-link').html(''
        //+'<a href="' + shareLink + '">' 
        //+ '<img src="media/svg/share.svg" class="icon-action h30 w30" alt="Share Link" title="Share Link"/></a>'
        + '<img src="media/svg/share.svg" class="icon-basic" alt="Share Link" title="Share Link"/>'
        + '<input type="text" class="text-input w88p" value="' + shareLink + '">');

    // Modal title (Artist @ venue on date)
    $('.modal-title').html(
        (!isBlank(event.artist) ? event.artist + ' @ ' : '') 
        + event.venue 
        + ' / ' + event.nice_date);

    // Select all text in sharing link input on click or tap
    $('#share-link input:text').focus(function() { 
        // Select all text when on mobile
        $(this)[0].setSelectionRange(0, 9999);
        // Select all on desktop/laptop
        $(this).select(); 
    });
}// End lookupArtist


/**
 * startEventLookup(event)
 * Events / Artist info promise chain
 * @param {array} event Object containing all of the related show info
 */
function startEventLookup(event) {

    // returns $.ajax from Last.fm API
    Events.getArtistInfo(event.artist, 'getinfo')

        // Process results of original Last.fm API call
        .then(function(artistData) {
            // Get artist info wasn't so lucky
            if (artistData.error === 6) {
                console.log(' (+) Get info failed ...');
                return Events.getArtistInfo(event.artist, 'search')
                    .then(function(artistData) {
                        console.log(' (+) Falling back on Search');
                        // Returns artistInfo, even if blank
                        return Events.appendArtistInfo('artist-info', artistData);
                    });
            }// End if getInfo call failed

            // Yay, direct hit on artist name
            else {
                // returns artist name, used in the next .then
                return Events.appendArtistInfo('artist-info', artistData);
            }
        })// End what to do after getArtistInfo

        .then(function(artistName) {      
            // returns $.ajax from Youtube API
            return Events.getTopTracks(artistName);
        })// End what to do after appendArtistInfo

        .then(function(trackData) {
            Events.appendTopTracks('artist-tracks', trackData);
        });
}// End startEventLookup

//
// document.ready
//
$(document).ready(function() {
    var d = new Date();
    var hour = d.getHours();
    var day =  d.getUTCDay(); // Sunday = 0, Sat = 6

    // USER STATE
    var mojUserState = UserState.getInstance();

    window.mojUS = mojUserState;

    // Set background plate
    $('#bg-plate').css('background', 'url("media/backgrounds/' + BG_PLATES[day] + '") ' 
        + 'no-repeat center bottom scroll');

    // 00.  INITIALIZE DISTANCE SLIDER
    $('#range-slider').slider({
        tooltip: 'always',
        formatter: function(value) {
            return value + ' miles';
        }
    });

    // Set slide listener to search for nearby venues on each drag
    $("#range-slider").on("slide", function(e) {
        var chosenDistance = e.value;
        // console.log(chosenDistance);

        Venues.getVenues(mojUserState.getSavedUserPosition(), 10, chosenDistance);
        //$("#ex6SliderVal").text(e.value);
    });

    // Asynchronously load modal template
    $.get('templates/artist-modal.html', function(template) {
        // Inject all those templates at the end of the document.
        $('body').append(template);
    });

    //
    // XX.  SET LISTENERS
    //
    $('#action-eml').click(function() {
        var emlad = rvStr($("#eml").data("u")) + '@' + rvStr($("#eml").data("dom"));
        document.location.href = 'ma' + 'il' + 'to' + ':' + emlad;
    });

    $('#gPlusLogin').click(function() {
        var ref = new Firebase("https://blinding-torch-6251.firebaseio.com");
        ref.onAuth(function(authData) {
            if (authData !== null) {
                console.log("Login Success!", authData);
                window.authData = authData;
            } 
            else {
                ref.authWithOAuthRedirect('google', function(error, authData) {
                    if (error) {
                        console.log("Problems Houston...", error);
                    }
                });// End authWithOAuthRedirect
            }// End else
        })// End ref.onAuth
    });

    $('#action-getposition').click(function() {
        // Append distance slider to toolbar
        //$('#slider-parent').toggleClass('display-none', false);
        
        // Fade out slider, remove distance constraint
        if ($('#slider-parent').is(":visible")) {
             $('#slider-parent').fadeOut(500);
             // TODO:  remove distance constraint from datatable
        }
        // Fade in slider, geolocate
        else {
            $('#slider-parent').fadeIn(500);
            // Get current position and enable distance slider if successful
            mojUserState.geoLocateUser(10000)   
                .then(function(position) {
                    // Immediately store current user position, saving
                    // lat, lon, and accuracy
                    mojUserState.setUserPosition(position);

                    // Grab coordinates separately for the first getVenues call
                    var coordinates = {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    };

                    // We have a position to work with, so activate distance slider
                    if (!isBlank(coordinates.lat)) {
                        $('#range-slider').slider('enable');
                    }

                    // Get venues close to us, passing in {lat,lon}, 
                    // max distance, and the current slider's search radius
                    Venues.getVenues(coordinates, 10, $("#range-slider").val());
                });
        }// End else case

    });// End action-getposition


    $('#getNearbyVenues').click(function() {
        // Get venues within 25 miles, max 10 results
        getNearbyVenues(25, 4);
    });

    // Should be calling set/loadPageState automatically!
    // 
    $('#setPageState').click(function() {
        // Parse the hashtag section from URL
        var lastSection = window.location.href.split("/").pop();
        console.log(lastSection);

        // Save the last visited page
        setPageState(lastSection);
    });


    // 
    // Get list of shows, display them, set click listeners on each Artist
    //
    Events.getEvents(1)
        // Return events $.ajax request
        .then(function(data) {
            // Parse the data into JSON object
            var eventData = JSON.parse(data);

            // Check for valid data before continuing
            if (eventData.success) {
                // Save event data to local storage
                mojUserState.events = Events.eventData = 
                    Events.remapEventArrayKeys(eventData.events);

                // JSON data will go into shows-content div
                Events.displayEvents(Events.eventData, CONTENT_DIV);

                //window.location.href.split('#');  
            }
            else {
                if (typeof (events === 'undefined') || !events.length) {
                    return Error("getEvents - did not receive any data ='(");
                }
                else {
                    return Error("getEvents - event data received, but success flag is not set");
                }
            }// End else        
            
        })// End events.getEvents().then
        // Once data is loaded, parse URL for a direct link (after the #)
        .then(function() {
            var request = parseUrlAction();
        })
        // Add old school click listener on parent div (will bubble up from Datatable)
        .then(function() {  
            // https://davidwalsh.name/event-delegate
            document.getElementById(CONTENT_DIV).addEventListener('click', function(e) {
                // Get the array index of the clicked element
                var eventid = $(e.target).data('eventid');
                var event = mojUserState.events[eventid];

                // Ensure that user has clicked on an actual link
                if (event !== undefined && event.hasOwnProperty('source')) {
                    // Manually change URL in address bar
                    window.history.pushState('', 'Event', '#' + Events.getEventByIndex(eventid).slug);
                    
                    // Pop up artist info modal
                    lookupArtist(event);
                }
                else {
                    // console.log("Click source is outside an event hit state");
                }
            });// End addEventListener
        });// End add old school click listener


    //
    // Replace regular action bar w/ mini action bar upon downward scroll
    // 
    $(window).scroll(function(e) { 
        var divHeight = 75;
        var $secondaryHeader = $('#secondaryHeader'); 

        // Squeeze down header
        if ($(this).scrollTop() > divHeight) {
            $('#titleHeader').addClass('titleHeader-secondary');
            $('#mojBannerText').addClass('mojBannerText-secondary');
        }
        // Return to original look
        else if ($(this).scrollTop() < divHeight) {
            $('#titleHeader').removeClass('titleHeader-secondary');
            $('#mojBannerText').removeClass('mojBannerText-secondary');
        } 
    });// End window.scroll trigger

});// End on Document Load
