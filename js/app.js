
// knockout.js view model
function viewModel() {
  var self = this;

  // categories
  self.categories = ko.observableArray(["Mexican", "Italian", "American", "Chinese", "Indian"]); // Initial items

  // Restaurants
  self.allRestaurants = ko.observableArray([]);

};

// initialize view model
ko.applyBindings(new viewModel());

// start map
var map;

// Create a new blank array for all the listing markers.
var markers = [];

// This global polygon variable is to ensure only ONE polygon is rendered.
var polygon = null;

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



  var locations = [
    {title: 'National Gallery of Art', location: {lat: 38.892060, lng: -77.019910}, category: 'art'},
    {title: "United States Holocaust Memorial Museum", location: {lat: 38.886690, lng: -77.032690}, category: 'history'},
    {title: 'National Air and Space Museum', location: {lat: 38.887560, lng: -77.019910}, category: 'science'},
    {title: 'Smithsonian National Museum of Natural History', location: {lat: 38.892000, lng: -76.992640}, category: 'science'},
    {title: 'National Museum of African American History and Culture', location: {lat: 38.891180, lng: -77.032750}, category: 'history'},
    {title: 'National Portrait Gallery', location: {lat: 38.897360, lng: -77.048090}, category: 'art'},
    {title: 'Newseum', location: {lat: 38.893180, lng: -77.019190}, category: 'history'},
    {title: 'Museum of the Bible', location: {lat: 38.884840, lng: -77.017140}, category: 'history'},
    {title: 'Smithsonian American Art Museum', location: {lat: 38.897210, lng: -77.022980}, category: 'art'},
    {title: 'The Phillips Collection', location: {lat: 38.911750, lng: -77.047020}, category: 'art'}
  ];


  // foursquare api call
  var foursquareUrl = "https://api.foursquare.com/v2/venues/explore?client_id=HOH430HARXOZWVQOACVEL2W2J5NKTHFZBLQWV4OUNIGH4ARH" +
            "&client_secret=CP2SWQHIFQ0MCLAYFOEAZ5O0Q4ZPIEX1K1DFD2COJHK0D112&v=20180323" +
            "&limit=50&categoryId=4bf58dd8d48988d18f941735&ll=38.89511,-77.03637";


  function foursquareError() {
    alert("Foursquare Error");
  }

  var foursquareSettings = {
    "async": true,
    "crossDomain": true,
    "url": foursquareUrl,
    "method": "GET",
    "error": foursquareError
  }

  $.ajax(foursquareSettings).done( function( data ) {

    //console.log(data['response']['groups']['0']['items']);
    var venues = data['response']['groups']['0']['items'];
    console.log(venues);
    var index;
    for (index = 0; index < venues.length; ++index) {


        // save key variables for venue
        var thisVenue = venues[index]['venue'];
        var venueName = thisVenue['name'];
        var venueLat = thisVenue['location']['lat'];
        var venueLng = thisVenue['location']['lng'];
        var venueCategory = thisVenue['categories'][0]['id'];


        /*
        // initialize vars for yelp api call
        var venueRatings;
        var venuePrice;
        var venueNumReviews;
        var venueImageUrl;

        var venue = {
          title: venueName,
          location: {lat: venueLat, lng: venueLng },
          category: venueCategory,
          ratings: venueRatings,
          price: venuePrice,
          num_reviews: venueNumReviews,
          image_url: venueImageUrl
        };
        */


      }
    });
  // End foursquare api call (and nested yelp api call)




  var largeInfowindow = new google.maps.InfoWindow();

  // Style the markers a bit. This will be our listing marker icon.
  var defaultIcon = makeMarkerIcon('0091ff');

  // Create a "highlighted location" marker color for when the user
  // mouses over the marker.
  var highlightedIcon = makeMarkerIcon('FFFF24');

  // The following group uses the location array to create an array of markers on initialize.
  for (var i = 0; i < locations.length; i++) {

    // Get the position from the location array.
    var position = locations[i].location;
    var title = locations[i].title;

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
    marker.addListener('click', function() {
      populateInfoWindow(this, largeInfowindow);
    });
    // Two event listeners - one for mouseover, one for mouseout,
    // to change the colors back and forth.
    marker.addListener('mouseover', function() {
      this.setIcon(highlightedIcon);
    });
    marker.addListener('mouseout', function() {
      this.setIcon(defaultIcon);
    });
  }
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
