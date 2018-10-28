

// store location data from api calls to build markers from
locations = [];

// start map
var map;

// container to hold markers
var markers = [];

// This global polygon variable is to ensure only ONE polygon is rendered.
var polygon = null;

// initialize the map with markers
function initMap() {
  // Create a styles array to use with the map.
  var styles = [
    {
      featureType: 'water',
      stylers: [
        { color: '#19a0d8' }
      ]
    },{
      featureType: 'administrative',
      elementType: 'labels.text.stroke',
      stylers: [
        { color: '#ffffff' },
        { weight: 6 }
      ]
    },{
      featureType: 'administrative',
      elementType: 'labels.text.fill',
      stylers: [
        { color: '#e85113' }
      ]
    },{
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [
        { color: '#efe9e4' },
        { lightness: -40 }
      ]
    },{
      featureType: 'transit.station',
      stylers: [
        { weight: 9 },
        { hue: '#e85113' }
      ]
    },{
      featureType: 'road.highway',
      elementType: 'labels.icon',
      stylers: [
        { visibility: 'off' }
      ]
    },{
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [
        { lightness: 100 }
      ]
    },{
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [
        { lightness: -100 }
      ]
    },{
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [
        { visibility: 'on' },
        { color: '#f0e4d3' }
      ]
    },{
      featureType: 'road.highway',
      elementType: 'geometry.fill',
      stylers: [
        { color: '#efe9e4' },
        { lightness: -25 }
      ]
    }
  ];

  // Constructor creates a new map centered on washington dc - only center and zoom are required.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 38.89511, lng: -77.03637},
    zoom: 13,
    styles: styles,
    mapTypeControl: false
  });

  // get api data
  // mapping of categories to foursquare id's
  museumCategories = {
    '4bf58dd8d48988d18f941735': 'art',
    '4bf58dd8d48988d190941735': 'history',
    '4bf58dd8d48988d191941735': 'science'
  }

  // foursquare api call
  var foursquareUrl = "https://api.foursquare.com/v2/venues/search";
  foursquareUrl += '?' + $.param({
    'll': '38.89511,-77.03637',
    'client_id': "HOH430HARXOZWVQOACVEL2W2J5NKTHFZBLQWV4OUNIGH4ARH",
    'client_secret': "CP2SWQHIFQ0MCLAYFOEAZ5O0Q4ZPIEX1K1DFD2COJHK0D112",
    'categoryId': '4bf58dd8d48988d18f941735,4bf58dd8d48988d190941735,4bf58dd8d48988d191941735',
    'limit': '10',
    'v': '20181026'
  });

  // settings for news api call
  var foursquareSettings = {
    "async": true,
    "crossDomain": true,
    "url": foursquareUrl,
    "method": "GET"
  }

  $.ajax(foursquareSettings).done( function( data ) {
    venues = data['response']['venues'];

    // get details on all 10 venues
    for (var i = 0; i < venues.length; i++) {
      // wrap in closure to save i location when making ajax calls
      (function (i) {

        // get basic values from initial request
        var venue = venues[i];
        var venueName = venue['name'];
        var venueCategory = museumCategories[venue['categories'][0]['id']];
        var venueAddress = venue['location']['formattedAddress'][0];
        var venueLat = venue['location']['lat'];
        var venueLng = venue['location']['lng'];

        // prepare url for request for more detailed information
        var wikipediaUrl = "https://en.wikipedia.org/w/api.php";
        wikipediaUrl += '?' + $.param({
          'action': "opensearch",
          'search': venueName,
          'limit': "3"
        });

        // settings for news api call
        var wikipediaSettings = {
          "async": true,
          "dataType": "jsonp",
          "crossDomain": true,
          "url": wikipediaUrl,
          "method": "GET"
        }

        // make wikipedia calls
        $.ajax(wikipediaSettings).done( function( data ) {

          var articles = data[3];
          var articleOutput;
          if (articles.length > 0) {
            articleOutput = "<p><h3>Top Wikipedia Articles:</h3><ul>";
            for (var j = 0; j < articles.length; j++) {
              var thisArticle = articles[j];
              thisArticle = '<li><a href="' + thisArticle + '" target="_blank">' + venueName + '</li>';
              articleOutput += thisArticle;
            }
            articleOutput += "</ul></p>";
          }
          else {
            articleOutput = "<p>No Wikipedia Articles Available</p>";
          }

          // build location object (to build marker with later)
          var location = {
            name: venueName,
            category: venueCategory,
            address: venueAddress,
            lat: venueLat,
            lng: venueLng,
            articles: articleOutput
          }

          // add location to array
          // this data will be used to fill the sidebar
          locations.push(location);

          // info window to display street view data
          var largeInfowindow = new google.maps.InfoWindow();

          // Style the markers a bit. This will be our listing marker icon.
          var defaultIcon = makeMarkerIcon('0091ff');

          // Create a "highlighted location" marker color for when the user
          // mouses over the marker.
          var highlightedIcon = makeMarkerIcon('FFFF24');

          // Get the position from the location array.
          var position = { lat: location['lat'], lng: location['lng'] };
          var title = location['name'];

          // Create a marker per location, and put into markers array.
          var marker = new google.maps.Marker({
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            icon: defaultIcon,
            id: i
          });

          // Push the marker to our array of markers.
          markers.push(marker);

          // Create an onclick event to open the large infowindow at each marker.
          // Make the marker bounce on click
          marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow);
            if (marker.getAnimation() !== null) {
              marker.setAnimation(null);
            } else {
              marker.setAnimation(google.maps.Animation.BOUNCE);
            }
          });

          // Two event listeners - one for mouseover, one for mouseout,
          // to change the colors back and forth.
          marker.addListener('mouseover', function() {
            this.setIcon(highlightedIcon);
          });

          // got back to original color when mouse leaves
          marker.addListener('mouseout', function() {
            this.setIcon(defaultIcon);
          });

          // initialize marker
          marker.setMap(map);

        }).fail(function(err) {
          throw err;
          alert("No Location Data Available");
        });

      })(i);
    }

  }).fail(function(err) {
    throw err;
    alert("No Wikipedia Articles Available");
  });

}


// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
  // Check to make sure the infowindow is not already opened on this marker.
  if (infowindow.marker != marker) {
    // Clear the infowindow content to give the streetview time to load.
    infowindow.setContent('');
    infowindow.marker = marker;
    // Make sure the marker property is cleared if the infowindow is closed.
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });
    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;
    // In case the status is OK, which means the pano was found, compute the
    // position of the streetview image, then calculate the heading, then get a
    // panorama from that and set the options
    function getStreetView(data, status) {
      if (status == google.maps.StreetViewStatus.OK) {
        var nearStreetViewLocation = data.location.latLng;
        var heading = google.maps.geometry.spherical.computeHeading(
          nearStreetViewLocation, marker.position);
          infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
          var panoramaOptions = {
            position: nearStreetViewLocation,
            pov: {
              heading: heading,
              pitch: 30
            }
          };
        var panorama = new google.maps.StreetViewPanorama(
          document.getElementById('pano'), panoramaOptions);
      } else {
        infowindow.setContent('<div>' + marker.title + '</div>' +
          '<div>No Street View Found</div>');
      }
    }
    // Use streetview service to get the closest streetview image within
    // 50 meters of the markers position
    streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
    // Open the infowindow on the correct marker.
    infowindow.open(map, marker);
  }
}

// This function will loop through the markers array and display them all.
function showListings() {
  var bounds = new google.maps.LatLngBounds();
  // Extend the boundaries of the map for each marker and display the marker
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
    bounds.extend(markers[i].position);
  }
  map.fitBounds(bounds);
}

// This function will loop through the listings and hide them all.
function hideMarkers(markers) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
}

// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21,34));
  return markerImage;
}

// knockout.js view model
// this is initialized
function viewModel(locations) {
  var self = this;

  // categories
  self.categories = ko.observableArray(["art", "history", "science"]); // Initial items

  // Museums
  self.museums = ko.observableArray(locations);
  //console.log(typeof self.museums);

  var peopleArray = [
        { name: 'Bert' },
        { name: 'Charles' },
        { name: 'Denise' }
    ];
  self.people = ko.observableArray(locations);

  //console.log(self.people());

};

// initialize view model
ko.applyBindings(new viewModel(locations));
